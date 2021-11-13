import { ColType, TypeSize } from './const';

export default class TBLBuffer {
  constructor(buf) {
    this.data = Buffer.from(buf);
    this.offset = 0;
  }

  parse = () => {
    const colSize = this.data.readUInt32LE(this.offset);
    this.offset += 4;

    const cols = [],
      rows = [];
    for (let i = 0; i < colSize; i++) {
      cols.push(this.data.readUInt32LE(this.offset));
      this.offset += 4;
    }

    const rowSize = this.data.readUInt32LE(this.offset);
    this.offset += 4;

    for (let i = 0; i < rowSize; i++) {
      const row = [];
      cols.forEach(col => {
        const data = col === ColType.STRING ? this.readString() : this.read(col);
        row.push(data);
      });
      rows.push(row);
    }

    return { cols, rows };
  }

  readString = () => {
    const textSize = this.data.readUInt32LE(this.offset);
    this.offset += 4;
    const data = this.data.slice(this.offset, this.offset + textSize).toString();
    this.offset += textSize;
    return data;
  }

  read = (col) => {
    let data = null;
    switch (col) {
      case ColType.BYTE:
        data = this.data.slice(this.offset, this.offset + 1)[0];
        break;
      case ColType.INT16:
        data = this.data.readInt16LE(this.offset);
        break;
      case ColType.UINT16:
        data = this.data.readUInt16LE(this.offset);
        break;
      case ColType.INT32:
        data = this.data.readInt32LE(this.offset);
        break;
      case ColType.UINT32:
        data = this.data.readUInt32LE(this.offset);
        break;
      case ColType.INT64:
        data = this.data.readInt64LE(this.offset);
        break;
      case ColType.UINT64:
        data = this.data.readUInt64LE(this.offset);
        break;
      case ColType.FLOAT32:
        data = this.data.readFloatLE(this.offset).toFixed(2);
        break;
    }

    this.offset += TypeSize[col];
    return data;
  }
}