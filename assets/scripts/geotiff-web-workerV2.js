importScripts("/assets/geotiff/geotiff.bundle.min.js")
importScripts("/assets/d3/d3.min.js")
importScripts("/assets/proj4/proj4.js")

const NODATAVALUE = -3.4028234663852886e38

proj4.defs([
  [
    "EPSG:32718",
    "+proj=utm +zone=18 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs ",
  ],
  [
    "EPSG:3111",
    "+proj=lcc +lat_1=-36 +lat_2=-38 +lat_0=-37 +lon_0=145 +x_0=2500000 +y_0=2500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
  ],
  [
    "EPSG:32767",
    "+proj=lcc +lat_1=-36 +lat_2=-38 +lat_0=-37 +lon_0=145 +x_0=2500000 +y_0=2500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  ],
  [
    "EPSG:28355",
    "+proj=utm +zone=55 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
  ],
  ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
])

self.onmessage = async message => {
  try {
    let arrayBuffer
    if ("url" in message.data) {
      const response = await fetch(message.data.url)

      arrayBuffer = await response.arrayBuffer()
    } else {
      arrayBuffer = message.data.arrayBuffer
    }

    console.log(message)

    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer)
    const image = await tiff.getImage()
    const geotiffEpsg = `EPSG:${image.getGeoKeys().ProjectedCSTypeGeoKey}`

    console.log(JSON.stringify(image.getGeoKeys()))

    let geotiffBbox = image.getBoundingBox()

    var height = image.getHeight()
    var width = image.getWidth()
    const rasters = await image.readRasters({ samples: message.data.samples })
    const tiffPixels = rasters[Object.keys(rasters)[0]]

    const dumbProject = false

    if (geotiffEpsg !== "EPSG:3857" && !dumbProject) {
      const bbox3857_rect = [
        proj4(geotiffEpsg, "EPSG:3857").forward([
          geotiffBbox[0],
          geotiffBbox[1],
        ]),
        proj4(geotiffEpsg, "EPSG:3857").forward([
          geotiffBbox[2],
          geotiffBbox[1],
        ]),
        proj4(geotiffEpsg, "EPSG:3857").forward([
          geotiffBbox[2],
          geotiffBbox[3],
        ]),
        proj4(geotiffEpsg, "EPSG:3857").forward([
          geotiffBbox[0],
          geotiffBbox[3],
        ]),
      ]

      let xCords = bbox3857_rect.reduce((value, coords) => {
        value.push(coords[0])
        return value
      }, [])

      let yCords = bbox3857_rect.reduce((value, coords) => {
        value.push(coords[1])
        return value
      }, [])

      postMessage(`xCords = ${xCords}`)
      postMessage(`yCords = ${yCords}`)

      const bbox3857 = [
        Math.min(...xCords),
        Math.min(...yCords),
        Math.max(...xCords),
        Math.max(...yCords),
      ]

      postMessage(`bbox3857 = ${bbox3857}`)

      let bbox4326

      bbox4326 = [
        ...proj4("EPSG:3857", "EPSG:4326").forward([bbox3857[0], bbox3857[1]]),
        ...proj4("EPSG:3857", "EPSG:4326").forward([bbox3857[2], bbox3857[3]]),
      ]

      postMessage(`geotiff bbox ${geotiffEpsg} = ${geotiffBbox}`)
      postMessage(`bbox3857 = ${bbox3857}`)
      postMessage(`bbox4326 = ${bbox4326}`)

      const geoTIFFProjection = proj4("EPSG:3857", geotiffEpsg)

      postMessage(`reprojecting from :${geotiffEpsg}`)

      var spdData = new Array(height)
      for (var j = 0; j < height; j++) {
        spdData[j] = new Array(width)
        for (var i = 0; i < width; i++) {
          spdData[j][i] = tiffPixels[i + j * width]
        }
      }

      const newHeight = height
      const newWidth = width

      const pixelBuffer = new ArrayBuffer(
        Float32Array.BYTES_PER_ELEMENT * newHeight * newWidth
      )
      const pixels = new Float32Array(pixelBuffer).fill(NODATAVALUE)

      for (var j = 0; j < newHeight; j++) {
        for (var i = 0; i < newWidth; i++) {
          // new pixel cords in 3857
          var coords = [
            bbox3857[0] + (i / newWidth) * (bbox3857[2] - bbox3857[0]),
            bbox3857[1] + (j / newHeight) * (bbox3857[3] - bbox3857[1]),
          ]

          // 3857 to geotiff coords
          coords = geoTIFFProjection.forward(coords)
          // geotiff coords to pixel coords
          var px =
            (width * (coords[0] - geotiffBbox[0])) /
            (geotiffBbox[2] - geotiffBbox[0])
          var py =
            (height * (coords[1] - geotiffBbox[1])) /
            (geotiffBbox[3] - geotiffBbox[1])

          var value
          if (
            Math.floor(px) >= 0 &&
            Math.ceil(px) < width &&
            Math.floor(py) >= 0 &&
            Math.ceil(py) < height
          ) {
            var dist1 = (Math.ceil(px) - px) * (Math.ceil(py) - py)
            var dist2 = (px - Math.floor(px)) * (Math.ceil(py) - py)
            var dist3 = (Math.ceil(px) - px) * (py - Math.floor(py))
            var dist4 = (px - Math.floor(px)) * (py - Math.floor(py))
            if (dist1 != 0 || dist2 != 0 || dist3 != 0 || dist4 != 0) {
              // Linear interpolation
              // value =
              //   spdData[Math.floor(py)][Math.floor(px)] * dist1 +
              //   spdData[Math.floor(py)][Math.ceil(px)] * dist2 +
              //   spdData[Math.ceil(py)][Math.floor(px)] * dist3 +
              //   spdData[Math.ceil(py)][Math.ceil(px)] * dist4

              // Nearest neighbour
              var maxDist = Math.max(dist1, dist2, dist3, dist4)

              if (maxDist === dist1 || maxDist === dist2) {
                value = spdData[Math.floor(py)]
              } else {
                value = spdData[Math.ceil(py)]
              }

              if (maxDist === dist1 || maxDist === dist3) {
                value = value[Math.floor(px)]
              } else {
                value = value[Math.ceil(px)]
              }
            } else {
              value = spdData[Math.floor(py)][Math.floor(px)]
            }
          } else {
            value = NODATAVALUE
          }

          pixels[i + j * newWidth] = value
        }
      }

      postMessage(
        {
          args: message.data,
          pixels: pixels,
          bbox: bbox4326,
          width: newWidth,
          height: newHeight,
        },
        [pixelBuffer]
      )
    } else {
      const bbox4326 = [
        ...proj4("EPSG:3857", "EPSG:4326").forward([
          geotiffBbox[0],
          geotiffBbox[1],
        ]),
        ...proj4("EPSG:3857", "EPSG:4326").forward([
          geotiffBbox[2],
          geotiffBbox[3],
        ]),
      ]

      postMessage(
        {
          args: message.data,
          pixels: tiffPixels,
          bbox: bbox4326,
          width: width,
          height: height,
        },
        [tiffPixels.buffer]
      )
    }
  } catch (error) {
    console.log(error)
    postMessage({ args: message.data, error: error.message })
  }
}
