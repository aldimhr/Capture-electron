// Fungsi untuk menyalin gambar ke clipboard
export function copyImageToClipboard(imageDataUrl) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = function () {
      canvas.width = image.width;
      canvas.height = image.height;

      ctx.drawImage(image, 0, 0);

      canvas.toBlob(function (blob) {
        navigator.clipboard
          .write([new ClipboardItem({ 'image/png': blob })])
          .then(function () {
            resolve();
          })
          .catch(function (error) {
            reject(error);
          });
      }, 'image/png');
    };

    image.onerror = function (error) {
      reject(error);
    };

    image.src = imageDataUrl;
  });
}
