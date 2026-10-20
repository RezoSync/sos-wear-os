package com.example.soswear.data

import com.example.soswear.service.SosLocation
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.time.Instant
import java.util.concurrent.TimeUnit

class SosApi {
    private val client = OkHttpClient.Builder()
        .connectTimeout(4, TimeUnit.SECONDS)
        .readTimeout(4, TimeUnit.SECONDS)
        .writeTimeout(4, TimeUnit.SECONDS)
        .build()

    fun startEmergency(baseUrl: String, id: String, name: String, location: SosLocation) {
        post(
            "$baseUrl/api/sos",
            JSONObject()
                .put("id", id)
                .put("name", name)
                .put("lat", location.latitude)
                .put("lng", location.longitude)
                .put("accuracy", location.accuracyMeters)
                .put("timestamp", Instant.ofEpochMilli(location.timeMillis).toString()),
        )
    }

    fun updateLocation(baseUrl: String, id: String, location: SosLocation) {
        post(
            "$baseUrl/api/sos/$id/location",
            JSONObject()
                .put("lat", location.latitude)
                .put("lng", location.longitude)
                .put("accuracy", location.accuracyMeters)
                .put("timestamp", Instant.ofEpochMilli(location.timeMillis).toString()),
        )
    }

    fun cancelEmergency(baseUrl: String, id: String) {
        post("$baseUrl/api/sos/$id/cancel", JSONObject())
    }

    private fun post(url: String, payload: JSONObject) {
        val request = Request.Builder()
            .url(url)
            .post(payload.toString().toRequestBody(JSON_MEDIA_TYPE))
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("El backend respondió HTTP ${response.code}.")
            }
        }
    }

    private companion object {
        val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }
}
