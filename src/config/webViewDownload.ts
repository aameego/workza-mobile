export const DOWNLOAD_FILE_TYPE = "DOWNLOAD_FILE";

/**
 * HRMS pages save files with blob URLs + `<a download>.click()`. That never
 * reaches Android DownloadManager inside a WebView. Intercept those clicks
 * and hand the bytes to native so they land in Downloads.
 */
export const DOWNLOAD_BRIDGE_SCRIPT = `
(function () {
  if (window.__workzaDownloadBridge) return;
  window.__workzaDownloadBridge = true;
  if (!window.ReactNativeWebView || !window.ReactNativeWebView.postMessage) return;
  var origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var href = this.href || this.getAttribute('href') || '';
    var name = this.getAttribute('download');
    if (name && href.indexOf('blob:') === 0) {
      fetch(href).then(function (r) { return r.blob(); }).then(function (blob) {
        var reader = new FileReader();
        reader.onloadend = function () {
          var dataUrl = String(reader.result || '');
          var comma = dataUrl.indexOf(',');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: '${DOWNLOAD_FILE_TYPE}',
            fileName: name,
            mimeType: blob.type || 'application/octet-stream',
            base64: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
          }));
        };
        reader.readAsDataURL(blob);
      }).catch(function () {});
      return;
    }
    return origClick.apply(this, arguments);
  };
})();
true;
`;

export type WebViewDownloadFile = {
  fileName: string;
  mimeType: string;
  base64: string;
};

export const sanitizeFileName = (name: string) => {
  const base = String(name || "").split(/[/\\]/).pop() || "download";
  const cleaned = base.replace(/[?*:|"<>]/g, "_").trim();
  return cleaned.slice(0, 180) || "download";
};

export const parseWebViewDownloadMessage = (raw: string): WebViewDownloadFile | null => {
  try {
    const data = JSON.parse(raw) as {
      type?: string;
      fileName?: string;
      mimeType?: string;
      base64?: string;
    };
    if (data?.type !== DOWNLOAD_FILE_TYPE) return null;
    if (!data.fileName || typeof data.base64 !== "string" || !data.base64) return null;
    return {
      fileName: sanitizeFileName(data.fileName),
      mimeType: data.mimeType || "application/octet-stream",
      base64: data.base64,
    };
  } catch {
    return null;
  }
};

export type SaveWebViewDownloadResult = {
  fileName: string;
  uri: string;
  location: "downloads" | "documents";
};

export const saveWebViewDownload = async (
  file: WebViewDownloadFile,
  {
    os,
    directory,
    writeFile,
    publishToDownloads,
  }: {
    os: string;
    directory: string;
    writeFile: (uri: string, base64: string) => Promise<void>;
    publishToDownloads?: (uri: string, fileName: string, mimeType: string) => Promise<string>;
  }
): Promise<SaveWebViewDownloadResult> => {
  const fileName = sanitizeFileName(file.fileName);
  const dest = `${directory}${fileName}`;
  await writeFile(dest, file.base64);
  if (os === "android" && publishToDownloads) {
    const publicUri = await publishToDownloads(dest, fileName, file.mimeType);
    return { fileName, uri: publicUri, location: "downloads" };
  }
  return { fileName, uri: dest, location: "documents" };
};
