const { deleteImage, uploadImage } = require('./uploadImage');

async function deleteOldImage(publicId) {
  if (!publicId) return;

  try {
    await deleteImage(publicId);
  } catch (error) {
    console.error(`Image cleanup failed for "${publicId}":`, error.message);
  }
}

async function saveRecordWithImage(record, file, folder, urlField, publicIdField, originalPublicId) {
  const previousPublicId = originalPublicId === undefined ? record[publicIdField] : originalPublicId;
  let uploadedImage;

  if (file) {
    uploadedImage = await uploadImage(file.buffer, folder);
    record[urlField] = uploadedImage.url;
    record[publicIdField] = uploadedImage.publicId;
  }

  try {
    await record.save();
  } catch (error) {
    if (uploadedImage) await deleteOldImage(uploadedImage.publicId);
    throw error;
  }

  if (previousPublicId && previousPublicId !== record[publicIdField]) {
    await deleteOldImage(previousPublicId);
  }

  return record;
}

module.exports = { saveRecordWithImage, deleteOldImage };
