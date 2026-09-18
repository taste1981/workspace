// Minimal C bridge over msrtc_rans EntropyCoder for the browser (WASM).
// One combined PMF (gaussian + bit-estimator distributions concatenated) so a
// whole frame's messages (y1, y0, z) are coded in a single encode/decode call —
// identical rANS stream to the Python path's three pushes, since the C++ coder
// iterates the array in reverse order.
#include <cstdint>
#include <cstdlib>
#include <cstring>

#include <msrtc_rans/EntropyCoder.h>

using namespace msrtc_rans;

namespace {

// IResizableBuffer backed by WASM-heap malloc with real growth.
class GrowableBuffer final : public IResizableBuffer {
public:
    GrowableBuffer() {
        m_size = 512;
        m_buffer = static_cast<std::byte*>(malloc(m_size));
    }
    ~GrowableBuffer() {
        free(m_buffer);
        free(m_new);
    }

    span<std::byte> GetBuffer() override { return { m_buffer, m_size }; }

    span<std::byte> BeginToGrow() override {
        free(m_new);
        m_newSize = m_size * 2;
        m_new = static_cast<std::byte*>(malloc(m_newSize));
        return { m_new, m_newSize };
    }

    void Commit() override {
        free(m_buffer);
        m_buffer = m_new;
        m_size = m_newSize;
        m_new = nullptr;
        m_newSize = 0;
    }

    void Rollback() override {
        free(m_new);
        m_new = nullptr;
        m_newSize = 0;
    }

private:
    std::byte* m_buffer = nullptr;
    size_t m_size = 0;
    std::byte* m_new = nullptr;
    size_t m_newSize = 0;
};

}  // namespace

extern "C" {

void* mlvc_encoder_create(const int32_t* lengths, const int32_t* offsets, const int32_t* table, int32_t numDists,
                          int32_t tableSize, int32_t symbolBits, int32_t bypassBits) {
    auto* enc = new EntropyEncoder();
    auto ec = enc->Initialize(RansVariant::RansByte, span<const int32_t>(lengths, numDists),
                              span<const int32_t>(offsets, numDists), span<const int32_t>(table, tableSize),
                              symbolBits, bypassBits);
    if (ec) {
        delete enc;
        return nullptr;
    }
    return enc;
}

void* mlvc_decoder_create(const int32_t* lengths, const int32_t* offsets, const int32_t* table, int32_t numDists,
                          int32_t tableSize, int32_t symbolBits, int32_t bypassBits) {
    auto* dec = new EntropyDecoder();
    auto ec = dec->Initialize(RansVariant::RansByte, span<const int32_t>(lengths, numDists),
                              span<const int32_t>(offsets, numDists), span<const int32_t>(table, tableSize),
                              symbolBits, bypassBits);
    if (ec) {
        delete dec;
        return nullptr;
    }
    return dec;
}

// Encode n symbols. On success returns 0 and sets *out to a freshly malloc'd
// copy of the stream (*outLen bytes). Caller frees with mlvc_free.
int32_t mlvc_encode(void* handle, const int32_t* indices, const int32_t* values, int32_t n, uint8_t** out,
                    int32_t* outLen) {
    auto* enc = static_cast<EntropyEncoder*>(handle);
    GrowableBuffer buffer;
    auto encoded = enc->Encode(buffer, span<const int32_t>(indices, n), span<const int32_t>(values, n));
    if (encoded.size() == 0) {
        return -1;
    }
    auto* copy = static_cast<uint8_t*>(malloc(encoded.size()));
    if (copy == nullptr) {
        return -2;
    }
    memcpy(copy, encoded.data(), encoded.size());
    *out = copy;
    *outLen = static_cast<int32_t>(encoded.size());
    return 0;
}

// Decode n symbols from data; 0 on success, nonzero on error (invalid stream).
int32_t mlvc_decode(void* handle, int32_t* values, const int32_t* indices, const uint8_t* data, int32_t dataLen,
                    int32_t n) {
    auto* dec = static_cast<EntropyDecoder*>(handle);
    auto ec = dec->Decode(span<int32_t>(values, n), span<const int32_t>(indices, n),
                          span<const std::byte>(reinterpret_cast<const std::byte*>(data), dataLen));
    return ec ? static_cast<int32_t>(ec.value()) : 0;
}

void mlvc_free(uint8_t* p) { free(p); }

void mlvc_destroy(void* handle) {
    delete static_cast<EntropyEncoder*>(handle);
}

// ---------------------------------------------------------------------------
// Stream API — multi-message decode (z first, then y sections whose scale
// indices depend on the decoded z), mirroring the Python RansDecoderStream path.
// ---------------------------------------------------------------------------

// Decoder stream: plain RansDecoderStream.
void* mlvc_decoder_stream_create() {
    auto* s = new RansDecoderStream();
    auto ec = s->Initialize(RansVariant::RansByte);
    if (ec) {
        delete s;
        return nullptr;
    }
    return s;
}

int32_t mlvc_decoder_stream_open(void* stream, const uint8_t* data, int32_t len) {
    auto ec = static_cast<RansDecoderStream*>(stream)->Open(
        span<const std::byte>(reinterpret_cast<const std::byte*>(data), len));
    return ec ? static_cast<int32_t>(ec.value()) : 0;
}

int32_t mlvc_decoder_stream_decode(void* stream, void* decoderHandle, int32_t* values, const int32_t* indices,
                                   int32_t n) {
    auto* dec = static_cast<EntropyDecoder*>(decoderHandle);
    auto ec = dec->Decode(span<int32_t>(values, n), span<const int32_t>(indices, n),
                          *static_cast<RansDecoderStream*>(stream));
    return ec ? static_cast<int32_t>(ec.value()) : 0;
}

int32_t mlvc_decoder_stream_check_eof(void* stream) {
    return static_cast<RansDecoderStream*>(stream)->CheckEOF() ? 1 : 0;
}

void mlvc_decoder_stream_destroy(void* stream) { delete static_cast<RansDecoderStream*>(stream); }

}  // extern "C"
