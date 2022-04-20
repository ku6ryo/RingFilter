
export async function getUserMedia() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: {
          ideal: 1280,
        },
        height: {
          ideal: 720,
        }
      },
    })
  } else {
    alert("getUserMedia not supported on your browser!");
  }
}