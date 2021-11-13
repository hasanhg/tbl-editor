export const ColType = {
  BYTE: 2,
  INT16: 3,
  UINT16: 4,
  INT32: 5,
  UINT32: 6,
  STRING: 7,
  FLOAT32: 8,
  INT64: 9,
  UINT64: 10,
}

export const TypeSize = {
  [ColType.BYTE]: 1,
  [ColType.INT16]: 2,
  [ColType.UINT16]: 2,
  [ColType.INT32]: 4,
  [ColType.UINT32]: 4,
  [ColType.FLOAT32]: 4,
  [ColType.INT64]: 8,
  [ColType.UINT64]: 8,
}

export const TypeTitles = {
  [ColType.BYTE]: "Byte",
  [ColType.INT16]: "Int16",
  [ColType.UINT16]: "UInt16",
  [ColType.INT32]: "Int32",
  [ColType.UINT32]: "UInt32",
  [ColType.STRING]: "String",
  [ColType.FLOAT32]: "Float32",
  [ColType.INT64]: "Int64",
  [ColType.UINT64]: "UInt64",
}