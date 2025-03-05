
// const video = document.getElementById("video");

// let faceMatcher; 

// Promise.all([
//   faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
//   faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
//   faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
// ]).then(startWebcam);

// function startWebcam() {
//   navigator.mediaDevices
//     .getUserMedia({
//       video: true,
//       audio: false,
//     })
//     .then((stream) => {
//       video.srcObject = stream;
//       video.addEventListener("play", faceRecognition);
//     })
//     .catch((error) => {
//       console.error(error);
//     });
// }

// async function getLabeledFaceDescriptions() {
//   const labels = ["Al_Faiz", "Aryan","Divyanshu","Ranveer", "Riktom","Sai_Dushwant","Tejas"];
//   return Promise.all(
//     labels.map(async (label) => {
//       const descriptions = [];
//       for (let i = 1; i <= 2; i++) {
//         try {
//           const img = await faceapi.fetchImage(`./labels/${label}/${i}.jpg`);
//           const detections = await faceapi
//             .detectSingleFace(img)
//             .withFaceLandmarks()
//             .withFaceDescriptor();
//           if (detections && detections.descriptor) {
//             descriptions.push(detections.descriptor);
//           } else {
//             console.warn(`No face detected for ${label} in image ${i}`);
//           }
//         } catch (error) {
//           console.error(`Error processing ${label} image ${i}:`, error);
//         }
//       }

//       // Check if descriptors were computed
//       if (descriptions.length > 0) {
//         return new faceapi.LabeledFaceDescriptors(label, descriptions);
//       } else {
//         console.warn(`No descriptors computed for ${label}`);
//         return null; // Return null if no descriptors were computed
//       }
//     })
//   ).then((labeledDescriptors) => labeledDescriptors.filter(Boolean)); // Filter out null values
// }

// async function faceRecognition() {
//   const labeledFaceDescriptors = await getLabeledFaceDescriptions();
//   faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

//   const canvas = faceapi.createCanvasFromMedia(video);
//   document.body.append(canvas);

//   const displaySize = { width: video.width, height: video.height };
//   faceapi.matchDimensions(canvas, displaySize);

//   setInterval(async () => {
//     const detections = await faceapi
//       .detectAllFaces(video)
//       .withFaceLandmarks()
//       .withFaceDescriptors();

//     const resizedDetections = faceapi.resizeResults(detections, displaySize);

//     canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

//     const results = resizedDetections.map((d) => {
//       return faceMatcher.findBestMatch(d.descriptor);
//     });
//     results.forEach((result, i) => {
//       const box = resizedDetections[i].detection.box;
//       console.log(result);
//       const drawBox = new faceapi.draw.DrawBox(box, {
//         label: result.toString(),
//       });
//       drawBox.draw(canvas);
//     });
//   }, 100);
// }





const video = document.getElementById("video");
const recognizedFaces = {};

let faceMatcher;

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
      video.addEventListener("play", faceRecognition);
    })
    .catch((error) => {
      console.error(error);
    });
}

async function getLabeledFaceDescriptions() {
  const labels = ["Al_Faiz", "Aryan", "Divyanshu", "Ranveer", "Riktom", "Sai_Dushwant", "Tejas"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        try {
          const img = await faceapi.fetchImage(`./labels/${label}/${i}.jpg`);
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
          if (detections && detections.descriptor) {
            descriptions.push(detections.descriptor);
          } else {
            console.warn(`No face detected for ${label} in image ${i}`);
          }
        } catch (error) {
          console.error(`Error processing ${label} image ${i}:`, error);
        }
      }

      if (descriptions.length > 0) {
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      } else {
        console.warn(`No descriptors computed for ${label}`);
        return null;
      }
    })
  ).then((labeledDescriptors) => labeledDescriptors.filter(Boolean));
}

async function markAttendance(label) {
  if (!recognizedFaces[label]) {
    recognizedFaces[label] = true;
    console.log(`${label} is marked as present.`);
    
    try {
      // Replace with your backend API endpoint to save attendance
      const response = await fetch('/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      });

      if (response.ok) {
        console.log(`Attendance for ${label} saved successfully.`);
      } else {
        console.error(`Failed to save attendance for ${label}.`);
      }
    } catch (error) {
      console.error(`Error saving attendance for ${label}:`, error);
    }
  }
}

async function faceRecognition() {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor);
    });

    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const label = result.toString();
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: label,
      });
      drawBox.draw(canvas);

      if (result._distance < 0.6) { // Adjust this threshold as needed
        markAttendance(label);
      }
    });
  }, 100);
}
fetch('/mark-attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ label }),
})
.then(response => response.json())
.then(data => {
  // Display success message
  console.log('Attendance marked successfully:', data);

  // Stop the camera stream
  const video = document.getElementById('video');
  
  // Pause the video
  video.pause();

  // Check for tracks and stop them
  const stream = video.srcObject;
  
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
  }

  // Clear the video source to stop the stream
  video.srcObject = null;
})
.catch(error => {
  console.error('Error marking attendance:', error);
  // Handle error
});






