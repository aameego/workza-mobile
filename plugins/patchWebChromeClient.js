/** Android "Allow this time" can leave checkSelfPermission GRANTED after a kill.
 *  requestPermissions is what re-shows the system dialog. */
const CAMERA_CHECK = `            if (androidPermission != null) {
                if (ContextCompat.checkSelfPermission(this.mWebView.getThemedReactContext(), androidPermission) == PackageManager.PERMISSION_GRANTED) {
                    grantedPermissions.add(requestedResource);
                } else {
                    requestedAndroidPermissions.add(androidPermission);
                }
            }`;

const CAMERA_ALWAYS_ASK = `            if (androidPermission != null) {
                // Always ask the OS. checkSelfPermission can stay GRANTED after
                // Android "Allow this time" even when the system would re-prompt.
                requestedAndroidPermissions.add(androidPermission);
            }`;

const GEO_CHECK = `        if (ContextCompat.checkSelfPermission(this.mWebView.getThemedReactContext(), Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {

            /*
             * Keep the trace of callback and origin for the async permission request
             */
            geolocationPermissionCallback = callback;
            geolocationPermissionOrigin = origin;

            requestPermissions(Collections.singletonList(Manifest.permission.ACCESS_FINE_LOCATION));

        } else {
            callback.invoke(origin, true, false);
        }`;

const GEO_ALWAYS_ASK = `        geolocationPermissionCallback = callback;
        geolocationPermissionOrigin = origin;
        requestPermissions(Collections.singletonList(Manifest.permission.ACCESS_FINE_LOCATION));`;

function patchWebChromeClientSource(src) {
  if (!src.includes("onPermissionRequest")) return src;
  let next = src;
  if (next.includes(CAMERA_CHECK)) next = next.replace(CAMERA_CHECK, CAMERA_ALWAYS_ASK);
  if (next.includes(GEO_CHECK)) next = next.replace(GEO_CHECK, GEO_ALWAYS_ASK);
  return next;
}

module.exports = {
  patchWebChromeClientSource,
  CAMERA_ALWAYS_ASK,
};
