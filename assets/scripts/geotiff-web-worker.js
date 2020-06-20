importScripts("/assets/geotiff/geotiff.bundle.min.js")

self.onmessage = async message => {
  try {
    let arrayBuffer
    if ("url" in message.data) {
      const response = await fetch(message.data.url)

      arrayBuffer = await response.arrayBuffer()
    } else {
      arrayBuffer = message.data.arrayBuffer
    }
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer)

    const image = await tiff.getImage()

    const epsg = image.getGeoKeys().ProjectedCSTypeGeoKey

    const bbox = image.getBoundingBox()
    const width = image.getWidth()
    const height = image.getHeight()

    const results = await image.readRasters({ samples: message.data.samples })

    const pixels = results[Object.keys(results)[0]]

    postMessage({ args: message.data, pixels, bbox, width, height, epsg }, [
      pixels.buffer,
    ])
  } catch (error) {
    postMessage({ args: message.data, error: error.message })
  }
}
