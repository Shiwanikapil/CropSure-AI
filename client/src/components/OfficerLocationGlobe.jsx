import { Cartesian2, Cartesian3, Color, EllipsoidTerrainProvider, HorizontalOrigin, LabelStyle, OpenStreetMapImageryProvider, VerticalOrigin } from 'cesium'
import { CameraFlyTo, Entity, ImageryLayer, Viewer } from 'resium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

// OpenStreetMap supplies the visible map layer without an API token.
const mapTiles = new OpenStreetMapImageryProvider({
  url: 'https://tile.openstreetmap.org/',
})

function OfficerLocationGlobe({ latitude, longitude, label }) {
  const hasLocation = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))

  if (!hasLocation) return <div className="location-map-fallback">Field coordinates are not available for this report.</div>

  const position = Cartesian3.fromDegrees(Number(longitude), Number(latitude), 120)
  // Position the camera outside the globe on the report field's side, then
  // explicitly look toward Earth's centre. This keeps the whole 3D globe
  // centred in a circular frame instead of showing a close-up horizon.
  const cameraDestination = Cartesian3.multiplyByScalar(
    Cartesian3.normalize(position, new Cartesian3()),
    16000000,
    new Cartesian3()
  )
  const cameraDirection = Cartesian3.negate(
    Cartesian3.normalize(cameraDestination, new Cartesian3()),
    new Cartesian3()
  )
  return (
    <div className="location-map">
      <Viewer
        animation={false}
        baseLayer={false}
        baseLayerPicker={false}
        fullscreenButton={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        selectionIndicator={false}
        skyAtmosphere={false}
        skyBox={false}
        timeline={false}
        terrainProvider={new EllipsoidTerrainProvider()}
      >
        <ImageryLayer imageryProvider={mapTiles} />
        <Entity
          name={label || 'Reported field'}
          position={position}
          point={{
            pixelSize: 20,
            color: Color.fromCssColorString('#22c55e'),
            outlineColor: Color.WHITE,
            outlineWidth: 4,
            heightReference: 0,
          }}
          label={{
            text: label || 'Reported field',
            fillColor: Color.fromCssColorString('#475569'),
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
            showBackground: false,
            font: 'bold 14px sans-serif',
            horizontalOrigin: HorizontalOrigin.CENTER,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -22),
          }}
        />
        <CameraFlyTo
          destination={cameraDestination}
          orientation={{ direction: cameraDirection, up: Cartesian3.UNIT_Z }}
          duration={0.8}
        />
      </Viewer>
    </div>
  )
}

export default OfficerLocationGlobe
