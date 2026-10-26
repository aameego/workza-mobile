package expo.modules.workzadownloads

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileInputStream

private const val CHANNEL_ID = "workza-downloads"

class WorkzaDownloadsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WorkzaDownloads")

    OnCreate {
      val context = appContext.reactContext ?: return@OnCreate
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(
          NotificationChannel(CHANNEL_ID, "Downloads", NotificationManager.IMPORTANCE_DEFAULT)
        )
      }
    }

    AsyncFunction("saveToPublicDownloads") { fileUri: String, fileName: String, mimeType: String ->
      val context = appContext.reactContext ?: throw IllegalStateException("React context lost")
      val source = File(fileUri.removePrefix("file://"))
      if (!source.exists()) {
        throw IllegalStateException("Downloaded file is missing")
      }

      val publicUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        copyToMediaStore(context, source, fileName, mimeType)
      } else {
        copyToLegacyDownloads(source, fileName)
      }
      notifyComplete(context, fileName)
      publicUri
    }
  }

  private fun copyToMediaStore(context: Context, source: File, fileName: String, mimeType: String): String {
    val values = ContentValues().apply {
      put(MediaStore.Downloads.DISPLAY_NAME, fileName)
      put(MediaStore.Downloads.MIME_TYPE, mimeType.ifBlank { "application/octet-stream" })
      put(MediaStore.Downloads.IS_PENDING, 1)
    }
    val resolver = context.contentResolver
    val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
      ?: throw IllegalStateException("Could not create the download")
    resolver.openOutputStream(uri)?.use { output ->
      FileInputStream(source).use { input -> input.copyTo(output) }
    } ?: throw IllegalStateException("Could not write the download")
    values.clear()
    values.put(MediaStore.Downloads.IS_PENDING, 0)
    resolver.update(uri, values, null, null)
    return uri.toString()
  }

  private fun copyToLegacyDownloads(source: File, fileName: String): String {
    val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
    dir.mkdirs()
    val dest = File(dir, fileName)
    source.copyTo(dest, overwrite = true)
    return dest.absolutePath
  }

  private fun notifyComplete(context: Context, fileName: String) {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context)
    }
    val notification = builder
      .setContentTitle("Download complete")
      .setContentText(fileName)
      .setSmallIcon(android.R.drawable.stat_sys_download_done)
      .setAutoCancel(true)
      .build()
    manager.notify(fileName.hashCode(), notification)
  }
}
