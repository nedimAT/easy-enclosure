declare module '@jscad/stl-serializer' {
  import { Geom3 } from '@jscad/modeling/src/geometries/types'

  export function serialize(options: { binary: boolean }, ...geometries: Geom3[]): string
}