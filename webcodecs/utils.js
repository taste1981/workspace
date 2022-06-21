
// For PostTask()
let nextTaskId = 1;
const activeTaskIds = new Map();		// id -> callback
const taskMessageChannel = new MessageChannel();
taskMessageChannel.port2.onmessage = function OnTask(e)
{
	const id = e.data;
	const callback = activeTaskIds.get(id);
	activeTaskIds.delete(id);
	callback();
};

export function PostTask(callback)
{
	const id = nextTaskId++;
	activeTaskIds.set(id, callback);
	taskMessageChannel.port1.postMessage(id);
	return id;
}

// For downloading resulting video
export function Download(filename, url)
{
	const a = document.createElement("a");
	a.textContent = filename;
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}