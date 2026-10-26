import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DOWNLOAD_BRIDGE_SCRIPT,
  DOWNLOAD_FILE_TYPE,
  parseWebViewDownloadMessage,
  sanitizeFileName,
  saveWebViewDownload,
} from "./webViewDownload.ts";

describe("DOWNLOAD_BRIDGE_SCRIPT", () => {
  it("turns blob anchor downloads into a native DOWNLOAD_FILE message", () => {
    assert.match(DOWNLOAD_BRIDGE_SCRIPT, /HTMLAnchorElement\.prototype\.click/);
    assert.match(DOWNLOAD_BRIDGE_SCRIPT, /blob:/);
    assert.match(DOWNLOAD_BRIDGE_SCRIPT, new RegExp(DOWNLOAD_FILE_TYPE));
  });
});

describe("parseWebViewDownloadMessage", () => {
  it("accepts a file posted from the HRMS WebView", () => {
    assert.deepEqual(
      parseWebViewDownloadMessage(
        JSON.stringify({
          type: DOWNLOAD_FILE_TYPE,
          fileName: "Attendance_Report_2026-10-21.xlsx",
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          base64: "UEs=",
        })
      ),
      {
        fileName: "Attendance_Report_2026-10-21.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        base64: "UEs=",
      }
    );
  });

  it("rejects unrelated or incomplete messages", () => {
    assert.equal(parseWebViewDownloadMessage("not-json"), null);
    assert.equal(
      parseWebViewDownloadMessage(JSON.stringify({ type: "REQUEST_ATTENDANCE_MEDIA" })),
      null
    );
    assert.equal(
      parseWebViewDownloadMessage(JSON.stringify({ type: DOWNLOAD_FILE_TYPE, fileName: "a.xlsx" })),
      null
    );
  });
});

describe("sanitizeFileName", () => {
  it("keeps a normal report name and strips path characters", () => {
    assert.equal(sanitizeFileName("Attendance_Report.xlsx"), "Attendance_Report.xlsx");
    assert.equal(sanitizeFileName("../evil.xlsx"), "evil.xlsx");
    assert.equal(sanitizeFileName(""), "download");
  });
});

describe("saveWebViewDownload", () => {
  it("writes the file and publishes it to Android Downloads", async () => {
    const written = [];
    const published = [];
    const result = await saveWebViewDownload(
      {
        fileName: "Attendance_Report.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        base64: "UEs=",
      },
      {
        os: "android",
        directory: "file:///data/user/0/app/cache/",
        writeFile: async (uri, base64) => {
          written.push({ uri, base64 });
        },
        publishToDownloads: async (uri, fileName, mimeType) => {
          published.push({ uri, fileName, mimeType });
          return "content://downloads/my_downloads/12";
        },
      }
    );
    assert.deepEqual(written, [
      { uri: "file:///data/user/0/app/cache/Attendance_Report.xlsx", base64: "UEs=" },
    ]);
    assert.deepEqual(published, [
      {
        uri: "file:///data/user/0/app/cache/Attendance_Report.xlsx",
        fileName: "Attendance_Report.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ]);
    assert.deepEqual(result, {
      fileName: "Attendance_Report.xlsx",
      uri: "content://downloads/my_downloads/12",
      location: "downloads",
    });
  });

  it("keeps the file in app documents when public Downloads are unavailable", async () => {
    const result = await saveWebViewDownload(
      {
        fileName: "Attendance_Report.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        base64: "UEs=",
      },
      {
        os: "ios",
        directory: "file:///var/mobile/Documents/",
        writeFile: async () => {},
      }
    );
    assert.deepEqual(result, {
      fileName: "Attendance_Report.xlsx",
      uri: "file:///var/mobile/Documents/Attendance_Report.xlsx",
      location: "documents",
    });
  });
});
