const buildWeatherUrl = (lat, lng) => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    timezone: 'auto'
  })
  return `https://api.open-meteo.com/v1/forecast?${params}`
}

const getWeatherEvidence = async (lat, lng) => {
  const response = await fetch(buildWeatherUrl(lat, lng))
  if (!response.ok) throw new Error(`Weather API returned ${response.status}`)

  const data = await response.json()
  return {
    provider: 'Open-Meteo',
    observedAt: data.current?.time ? new Date(data.current.time) : new Date(),
    temperatureC: data.current?.temperature_2m,
    humidityPercent: data.current?.relative_humidity_2m,
    precipitationMm: data.current?.precipitation,
    windSpeedKmh: data.current?.wind_speed_10m,
    weatherCode: data.current?.weather_code
  }
}

module.exports = { getWeatherEvidence }
