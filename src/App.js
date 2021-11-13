import './App.css';
import React from 'react';
import ReactDataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import { IconButton, Input, SvgIcon, TextField, Tooltip, Typography } from '@mui/material';
import { withStyles } from '@mui/styles';
import TBLBuffer from './tbl/buffer';
import { TypeTitles } from './tbl/const';
import { mdiArrowLeft, mdiArrowRight } from '@mdi/js';


const styles = theme => ({
  cell: {
    padding: '4px 12px',
    fontFamily: 'Roboto',
    display: 'inline'
  },
  colCell: {

  },
  hCell: {
    border: '1px solid #ddd',
  },
  pageRoot: {
    height: 36,
  },
  pageInput: {
    textAlign: 'center',
  }
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      as: 'table',
      columns: [],
      grid: [],
      _grid: [],
      selections: [false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      page: 0,
      _page: 0,
      size: 100,
    };

    this.lastMouseAt = Date.now();
    this.mouseX = null;
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    const temp = document.getElementById('temp');
    document.addEventListener('mousemove', (e) => {
      temp.style.left = e.clientX - 2 + 'px';
    });
  }

  handleSelect = (e) => {
    this.setState({ as: e.target.value })
  }

  handleSelectAllChanged = (selected) => {
    const selections = this.state.selections.map(s => selected)
    this.setState({ selections })
  }

  handleSelectChanged = (index, selected) => {
    const selections = [...this.state.selections]
    selections[index] = selected
    this.setState({ selections })
  }

  handleCellsChanged = (changes, additions) => {
    const grid = this.state.grid.map(row => [...row])
    changes.forEach(({ cell, row, col, value }) => {
      grid[row][col] = { ...grid[row][col], value }
    })
    // paste extended beyond end, so add a new row
    additions && additions.forEach(({ cell, row, col, value }) => {
      if (!grid[row]) {
        grid[row] = [{ value: '' }, { value: '' }, { value: '' }, { value: 0 }]
      }
      if (grid[row][col]) {
        grid[row][col] = { ...grid[row][col], value }
      }
    })
    this.setState({ grid })
  }

  sheetRenderer = (props) => {
    const { columns, selections } = this.state
    switch (this.state.as) {
      case 'list':
        return <SheetRenderer columns={columns} selections={selections} onSelectAllChanged={this.handleSelectAllChanged} as='segment' headerAs='div' bodyAs='ul' rowAs='div' cellAs='div' {...props} {...this.props} setState={s => this.setState(s)} state={this.state} />
      case 'div':
        return <SheetRenderer columns={columns} selections={selections} onSelectAllChanged={this.handleSelectAllChanged} as='div' headerAs='div' bodyAs='div' rowAs='div' cellAs='div' {...props} {...this.props} setState={s => this.setState(s)} state={this.state} />
      default:
        return <SheetRenderer columns={columns} selections={selections} onSelectAllChanged={this.handleSelectAllChanged} as='table' headerAs='thead' bodyAs='tbody' rowAs='tr' cellAs='th' {...props} {...this.props} setState={s => this.setState(s)} state={this.state} />
    }
  }

  rowRenderer = (props) => {
    const { selections } = this.state
    switch (this.state.as) {
      case 'list':
        return <RowRenderer as='li' cellAs='div' selected={selections[props.row]} onSelectChanged={this.handleSelectChanged} className='data-row' {...props} state={this.state} />
      case 'div':
        return <RowRenderer as='div' cellAs='div' selected={selections[props.row]} onSelectChanged={this.handleSelectChanged} className='data-row' {...props} state={this.state} />
      default:
        return <RowRenderer as='tr' cellAs='td' selected={selections[props.row]} onSelectChanged={this.handleSelectChanged} className='data-row' {...props} state={this.state} />
    }
  }

  cellRenderer = (props) => {
    switch (this.state.as) {
      case 'list':
        return <CellRenderer as='div' columns={this.state.columns} {...props} state={this.state} />
      case 'div':
        return <CellRenderer as='div' columns={this.state.columns} {...props} state={this.state} />
      default:
        return <CellRenderer as='td' columns={this.state.columns} {...props} state={this.state} />
    }
  }

  onCellsChanged = changes => {
    const grid = this.state.grid;
    changes.forEach(({ cell, row, col, value }) => {
      grid[row][col] = { ...grid[row][col], value };
    });
    this.setState({ grid });
  };

  onContextMenu = (e, cell, i, j) =>
    cell.readOnly ? e.preventDefault() : null;


  onChange = (e) => {
    const files = Object.values(this.inputRef.current.files);
    var invalid = false;

    let file = null;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f && f.name.endsWith('.tbl')) {
        file = f;
        break;
      }
    }

    const fr = new FileReader();
    fr.onload = (e) => {
      const b64 = e.target.result;
      const buf = Buffer.from(b64);
      const tbl = new TBLBuffer(buf);
      const table = tbl.parse();

      const columns = table.cols.map((col, i) => {
        return {
          label: TypeTitles[col],
          id: i,
          width: 200,
        }
      });

      const _grid = table.rows.map(row => {
        return row.map(cell => {
          return {
            value: cell
          };
        });
      });

      this.setState({ _grid, columns, grid: _grid.slice(0, this.state.size), page: 0, _page: 1 });
    };

    fr.readAsArrayBuffer(file);
  }

  refreshTable = (page, size) => {
    const total = this.state._grid.length / size;
    page = Math.max(page, 0);
    page = Math.min(page, total);
    const min = page * size;
    const max = min + size;
    this.setState({ grid: this.state._grid.slice(min, max), page, size, _page: page + 1 });
  }

  onPrevPage = () => {
    const page = Math.max(1, this.state.page - 1);
    this.refreshTable(page, this.state.size);
  }

  onPrevPage = () => {
    this.refreshTable(this.state.page - 1, this.state.size);
  }

  onNextPage = () => {
    this.refreshTable(this.state.page + 1, this.state.size);
  }

  pagination = () => {
    const { classes } = this.props;
    const total = Math.ceil(this.state._grid.length / this.state.size);
    const page = Math.min(this.state.page + 1, total);
    const disabled = total === 0;

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Typography style={{ marginRight: 12 }}>
          {page} of {total} pages
        </Typography>

        <Tooltip title='Previous Page' placement='bottom'>
          <IconButton onClick={this.onPrevPage} size='small' style={{ margin: '0px 4px' }} disabled={page <= 1}>
            <SvgIcon fontSize='small'><path d={mdiArrowLeft} color={page > 1 ? '#1b93d0' : '#ccc'} /></SvgIcon>
          </IconButton>
        </Tooltip>

        <TextField margin='dense' label='Page' variant='outlined' value={this.state._page}
          disabled={disabled}
          onChange={e => this.setState({ _page: e.target.value })}
          style={{ width: 56 }}
          InputProps={{
            classes: {
              root: classes.pageRoot,
              input: classes.pageInput,
            }
          }}
          onKeyPress={(ev) => {
            if (ev.key === 'Enter') {
              this.refreshTable(this.state._page - 1, this.state.size);
            }
          }} />

        <Tooltip title='Next Page' placement='top'>
          <IconButton onClick={this.onNextPage} size='small' style={{ margin: '0px 4px' }} disabled={page === total}>
            <SvgIcon fontSize='small'><path d={mdiArrowRight} color={page < total ? '#1b93d0' : '#ccc'} /></SvgIcon>
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  render() {
    const { classes } = this.props;
    return (
      <div style={{ backgroundColor: '#fff', width: 'fit-content', minWidth: '100%', height: 'fit-content', minHeight: '100%' }}>
        <div style={{ display: 'flex', width: '100%', position: 'fixed', top: 0, backgroundColor: '#fff' }}>
          <Input inputRef={this.inputRef} style={{ display: 'inline' }} name="licenses" type='file' margin='dense' onChange={this.onChange}
            hidden disableUnderline />
          <span style={{ flex: 1 }} />
          {this.pagination()}
        </div>

        <div style={{ backgroundColor: '#ccc', minWidth: '100%', minHeight: '100%', marginTop: 48 }}>
          <ReactDataSheet
            data={this.state.grid}
            valueRenderer={cell => cell.value}
            sheetRenderer={this.sheetRenderer}
            rowRenderer={this.rowRenderer}
            cellRenderer={this.cellRenderer}
            onContextMenu={this.onContextMenu}
            onCellsChanged={this.onCellsChanged}
          />
        </div>
      </div>
    );
  }
}

const onDragStart = (e, state, setState, i) => {
  setState({ dragX: e.clientX, dragI: i });
}

const onDragEnd = (e, state, setState, i) => {
  if (!state.dragX) return;
  i = i ? i : state.dragI;
  const width = Math.max(state.columns[i].width + e.clientX - state.dragX, 64);
  const columns = state.columns;
  columns[i] = { ...columns[i], width };
  setState({ columns, dragX: null, dragI: null });
}

const SheetRenderer = props => {
  const { as: Tag, headerAs: Header, bodyAs: Body, rowAs: Row, cellAs: Cell,
    className, columns, selections, onSelectAllChanged, classes, setState, state } = props

  const colName = (i) => {
    for (var ret = '', a = 1, b = 26; (i -= a) >= 0; a = b, b *= 26) {
      ret = String.fromCharCode(parseInt((i % b) / a) + 65) + ret;
    }
    return ret;
  }

  return (
    <div style={{ height: '100vh', cursor: state.dragX ? 'col-resize' : 'default' }} onMouseUp={(e) => onDragEnd(e, state, setState)}>
      <div id={'temp'} style={{ borderRight: state.dragX ? '2px solid #8cdcda' : null, left: 0, position: 'absolute', width: 2, height: '100vh' }} />
      <Tag className={className} style={{ width: 'fit-content' }}>
        <Header className='data-header'>
          <Row>
            {columns.length > 0 ?
              <Cell className='action-cell cell' style={{ backgroundColor: '#ccc', width: 64 }} /> :
              null
            }
            {columns.map((column, i) => {
              const col = colName(i + 1);
              return (
                <Cell className='cell' className={classes.colCell} style={{ width: column.width, fontWeight: 600, backgroundColor: '#696', color: '#fff', padding: 0 }} key={column.id}>
                  <div style={{ display: 'flex' }}>
                    <div style={{
                      borderLeft: state.hoverCol === i - 1 || state.dragI === i - 1 ? '2px solid #8cdcda' : '0px solid #ccc',
                      boxSizing: 'border-box', cursor: 'col-resize'
                    }} onMouseOver={e => setState({ hoverCol: i - 1 })} onMouseLeave={e => setState({ hoverCol: null })} onMouseDown={(e) => { onDragStart(e, state, setState, i - 1) }} />
                    <span style={{ padding: '2px 0px', width: '100%', userSelect: 'none' }}>{col}</span>
                    <span style={{ flex: 1 }} />
                    <div style={{
                      borderRight: state.hoverCol === i || state.dragI === i ? '2px solid #8cdcda' : '1px solid #ccc',
                      boxSizing: 'border-box', cursor: 'col-resize'
                    }} onMouseOver={e => setState({ hoverCol: i })} onMouseLeave={e => setState({ hoverCol: null })} onMouseDown={(e) => { onDragStart(e, state, setState, i) }} />
                  </div>
                </Cell>
              );
            }
            )}
          </Row>
          {props.children.length > 0 ?
            <Row>
              <Cell className='action-cell cell' style={{ fontWeight: 600, textAlign: 'center', backgroundColor: '#696', color: '#fff', padding: '2px 0px' }}>
                1
              </Cell>
              {columns.map(column => <Cell className='cell' className={classes.hCell} style={{ width: column.width, padding: '2px 0px', backgroundColor: '#fff' }} key={column.id}>{column.label}</Cell>)}
            </Row> :
            null
          }

        </Header>
        <Body className='data-body'>
          {props.children}
        </Body>
      </Tag >
    </div >
  )
}

const RowRenderer = props => {
  const { as: Tag, cellAs: Cell, className, row, selected, onSelectChanged, state } = props
  return (
    <Tag className={className}>
      <Cell className='action-cell cell' style={{ fontWeight: 600, textAlign: 'center', backgroundColor: '#696', color: '#fff', padding: '2px 0px' }}>
        {row + 2 + (state.page * state.size)}
      </Cell>
      {props.children}
    </Tag>
  )
}

const CellRenderer = props => {
  const {
    as: Tag, cell, row, col, columns, attributesRenderer,
    selected, editing, updated, style, state,
    ...rest
  } = props

  // hey, how about some custom attributes on our cell?
  const attributes = cell.attributes || {}
  // ignore default style handed to us by the component and roll our own
  attributes.style = { width: columns[col].width }
  if (col === 0) {
    attributes.title = cell.label
  }

  const nan = isNaN(cell.value);

  return (
    <Tag {...rest} {...attributes} style={{
      textAlign: nan ? 'left' : 'right', padding: '2px 8px', backgroundColor: '#fff',
    }}>
      {props.children}
    </Tag>
  )
}

export default withStyles(styles)(App);
