// Student photos are stored on Cloudinary at full size.
// Lists only show small avatars, so ask Cloudinary for a
// small, compressed version instead of the original image.
export const photoThumb = (url, size = 96) => {
  if (
    typeof url !== "string" ||
    !url.includes("res.cloudinary.com") ||
    !url.includes("/image/upload/")
  ) {
    return url;
  }

  // Already transformed
  if (/\/image\/upload\/[a-z]{1,2}_/.test(url)) {
    return url;
  }

  return url.replace(
    "/image/upload/",
    `/image/upload/c_fill,g_face,w_${size},h_${size},q_auto,f_auto/`
  );
};
