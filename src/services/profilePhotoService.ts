import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

function extensionFor(mimeType: string): string {
  const subtype = mimeType.split('/')[1]?.toLowerCase();
  return subtype && /^[a-z0-9]+$/.test(subtype) ? subtype : 'jpg';
}

/** Uploads one selected profile image and returns its Firebase Storage URL. */
export async function uploadProfilePhoto(
  uid: string,
  localUri: string,
  mimeType = 'image/jpeg'
): Promise<string> {
  if (!mimeType.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  const response = await fetch(localUri);
  const blob = await response.blob();
  if (blob.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error('Please choose an image smaller than 5 MB.');
  }

  const photoRef = ref(
    storage,
    `profilePhotos/${uid}/${Date.now()}.${extensionFor(mimeType)}`
  );
  await uploadBytes(photoRef, blob, { contentType: mimeType });
  return getDownloadURL(photoRef);
}
