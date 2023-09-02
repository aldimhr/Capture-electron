const test = document.getElementById('test');
// const capture = document.getElementById('capture');
const imgTest = document.getElementById('imgTest');
const imgPath = document.getElementById('image-path');

// Mendengarkan pesan dari proses utama melalui MessagePort
window.onmessage = (event) => {
  // event.source === window means the message is coming from the preload
  // script, as opposed to from an <iframe> or other source.
  if (event.source === window && event.data === 'shortcut-screenshot') {
    const [port] = event.ports;
    // Once we have the port, we can communicate directly with the main
    // process.
    port.onmessage = async (event) => {
      let { taskbarHeight } = event.data;

      await screenshotRender({ taskbarHeight });

      console.log('from main process:', event.data);
    };
  }
};

// capture.addEventListener('click', () => screenshotRender());

async function screenshotRender({ taskbarHeight }) {
  // Assuming you have the buffer data already from window.versions.captureScreen()
  const {
    img: buffer,
    filePath,
    saveDirectory,
    fileName,
  } = await window.electronAPI.handleCaptureScreen();
  imgPath.innerText = saveDirectory;

  // Convert the buffer to a Blob
  const blob = new Blob([buffer], { type: 'image/jpeg' }); // Change the 'type' accordingly if the image format is different (e.g., 'image/png')
  const imageUrl = URL.createObjectURL(blob);

  //  Create an Image element
  const img = new Image();

  //  Draw the image on the canvas
  img.onload = () => {
    // Create the img element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set the canvas dimensions to match the image
    const cropHeight = taskbarHeight || 0; // The height you want to cut from the bottom

    canvas.width = img.width;
    canvas.height = img.height - cropHeight;

    // Draw the entire image on the canvas
    ctx.drawImage(img, 0, 0);

    // adding class
    canvas.classList.add('w-full');

    const imageContainer = document.getElementById('imageContainer');

    const btnWrapper = buildElement({ element: 'div' });
    [
      { btn: 'Anotate' },
      { btn: 'Copy' },
      { btn: 'Save As' },
      { btn: 'Save' },
      { btn: 'Delete' },
    ].forEach((el) => {
      let element = buildElement({
        element: 'button',
        className: `px-2 py-1 border mr-2 cursor-pointer ${el.btn.replace(' ', '-').toLowerCase()}`,
        text: el.btn,
      });
      btnWrapper.append(element);
    });
    btnWrapper.classList.add('py-1');

    const wrapper = buildElement({ element: 'div', className: 'image' });
    const stepEl = buildElement({ element: 'p', className: 'font-bold', text: fileName });
    wrapper.appendChild(stepEl);
    wrapper.appendChild(btnWrapper);
    wrapper.appendChild(canvas);

    imageContainer.appendChild(wrapper);
  };

  // Set the 'src' attribute of the image to the Blob URL
  img.src = imageUrl;
}

function buildElement({ element, className, text, id }) {
  const el = document.createElement(element);
  if (text) el.innerText = text;
  if (id) el.id = id;
  if (className) {
    className.split(' ').forEach((cls) => {
      el.classList.add(cls);
    });
  }

  return el;
}

// let allBtntnAnotate = document.querySelectorAll('.anotate');
// let allBtntnCopy = document.querySelectorAll('.copy');
// let allBtntnDelete = document.querySelectorAll('.delete');
// let allBtntnSave = document.querySelectorAll('.save');
// let allBtntnSaveAs = document.querySelectorAll('.saveAs');

// allBtntnCopy.forEach((el) => {
//   el.addEventListener('click', () => {
//     let parentEl = el.parentNode;
//     console.log(parentEl);
//     let canvas = parentEl.parentNode.querySelector('canvas');
//     console.log(canvas);

//     return new Promise((resolve, reject) => {
//       canvas.toBlob(function (blob) {
//         navigator.clipboard
//           .write([new ClipboardItem({ 'image/png': blob })])
//           .then(function () {
//             // alert('Success copy image to clipboard!');
//             resolve();
//           })
//           .catch(function (error) {
//             reject(error);
//           });
//       }, 'image/png');
//     });
//   });
// });

// document.getElementById('imageContainer').addEventListener('click', async (event) => {
//   const target = event.target;
//   if (target.classList.contains('copy')) {
//     let parentEl = target.parentNode;
//     let canvas = parentEl.parentNode.querySelector('canvas');
// const ctx = canvas.getContext('2d');

// // Draw the image on the canvas
// ctx.drawImage(imageElement, 0, 0);

// // Convert the canvas to a data URL (Base64-encoded string)
// const dataURL = canvas.toDataURL();

// await window.electronAPI.handleCaptureCopy(canvas);
// return dataURL;

// canvas.toBlob(function (blob) {
//   navigator.clipboard
//     .write([new ClipboardItem({ 'image/png': blob })])
//     .then(function () {
//       alert('Success copy image to clipboard!');
//     })
//     .catch(function (error) {
//       console.error('Failed to copy image to clipboard:', error);
//     });
// }, 'image/png');
//   }
// });
