import './App.css';
import React from 'react';
import { withStyles } from '@mui/styles';
import ReactDataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormGroup, FormLabel, IconButton, Input, Radio, RadioGroup, SvgIcon, TextField, Tooltip, Typography } from '@mui/material';
import TBLBuffer from './tbl/buffer';
import { TypeTitles } from './tbl/const';
import { mdiArrowLeft, mdiArrowRight, mdiContentSave, mdiFilter, mdiFilterOutline, mdiFolderOpen } from '@mdi/js';


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
  },
  filterInput: {

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

      // Filters properties
      filtering: false,
      filterStr: '',
      //findDirection: 'all',
      filterInCol: null,
      filterMatchCase: false,
      filters: {},
      filteredGrid: [],

    };

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
        return <SheetRenderer columns={columns} selections={selections} onSelectAllChanged={this.handleSelectAllChanged} as='segment' headerAs='div' bodyAs='ul' rowAs='div' cellAs='div' {...props} {...this.props} setState={s => this.setState(s)} state={this.state} doFilter={this.doFilter} />
      case 'div':
        return <SheetRenderer columns={columns} selections={selections} onSelectAllChanged={this.handleSelectAllChanged} as='div' headerAs='div' bodyAs='div' rowAs='div' cellAs='div' {...props} {...this.props} setState={s => this.setState(s)} state={this.state} doFilter={this.doFilter} />
      default:
        return <SheetRenderer columns={columns} selections={selections} onSelectAllChanged={this.handleSelectAllChanged} as='table' headerAs='thead' bodyAs='tbody' rowAs='tr' cellAs='th' {...props} {...this.props} setState={s => this.setState(s)} state={this.state} doFilter={this.doFilter} />
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

    if (!file) return;

    const fr = new FileReader();
    fr.onload = (e) => {
      if (!e.target.result) return;
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

      const grid = _grid.slice(0, this.state.size);
      this.setState({ _grid, columns, grid, filteredGrid: _grid, page: 0, _page: 1 });
    };

    fr.readAsArrayBuffer(file);
  }

  refreshTable = (page, size) => {
    const total = this.state.filteredGrid.length / size;
    page = Math.max(page, 0);
    page = Math.min(page, total);
    const min = page * size;
    const max = min + size;
    this.setState({ grid: this.state.filteredGrid.slice(min, max), page, size, _page: page + 1 });
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
    const total = Math.ceil(this.state.filteredGrid.length / this.state.size);
    const page = Math.min(this.state.page + 1, total);
    const disabled = total === 0;

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Typography style={{ marginRight: 12 }}>
          {page} of {total} pages
        </Typography>

        <Tooltip title='Previous Page' placement='bottom'>
          <span>
            <IconButton onClick={this.onPrevPage} size='small' style={{ margin: '0px 4px' }} disabled={page <= 1}>
              <SvgIcon fontSize='small'><path d={mdiArrowLeft} color={page > 1 ? '#1b93d0' : '#ccc'} /></SvgIcon>
            </IconButton>
          </span>
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
          <span>
            <IconButton onClick={this.onNextPage} size='small' style={{ margin: '0px 4px' }} disabled={page === total}>
              <SvgIcon fontSize='small'><path d={mdiArrowRight} color={page < total ? '#1b93d0' : '#ccc'} /></SvgIcon>
            </IconButton>
          </span>
        </Tooltip>
      </div >
    );
  }

  onOpen = () => {
    this.inputRef.current.click();
  }

  onSave = () => {

  }

  onFilterCancel = () => {
    this.setState({ filtering: false });
  }

  doFilter = (filters) => {
    let grid = Array.from(this.state._grid);

    Object.values(filters).forEach(filter => {
      const rows = [];
      grid.forEach((row, i) => {
        let cell = filter.col ? row[filter.col] : null;
        const found = !filter.col ? row.some(c => {
          cell = c;
          return filter.match ? cell.value.toString() === filter.str : cell.value.toString().includes(filter.str);
        }) :
          filter.match ? cell.value.toString() === filter.str : cell.value.toString().includes(filter.str);

        if (found) {
          cell.found = true;
          row.row = i;
          rows.push(row);
        }
      });

      grid = Array.from(rows);
    });

    this.setState({ filteredGrid: grid, filters }, () => {
      this.refreshTable(0, this.state.size);
    });
  }

  onFilter = () => {
    const { filterStr, filters, filterMatchCase } = this.state;
    if (!filterStr) return;

    filters[this.state.filterInCol] = { str: filterStr, col: this.state.filterInCol, match: filterMatchCase };
    this.doFilter(filters);

    this.setState({ filterStr: '', filterInCol: null, filterMatchCase: false });
    this.onFilterCancel();
  }

  filterWidget = () => {
    const { classes } = this.props;

    return (
      <Dialog
        onClose={this.onFilterCancel}
        open={this.state.filtering}
        onKeyPress={(ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
          }
        }}
        fullWidth={true}
        maxWidth={"sm"}
        disableEscapeKeyDown={false}>
        <DialogTitle style={{ userSelect: 'none' }}>
          {`Filter${Boolean(this.state.filterInCol) || this.state.filterInCol === 0 ? ` in ${colName(this.state.filterInCol + 1)}` : ''}`}
        </DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography style={{ marginRight: 12, userSelect: 'none' }}>Find what:</Typography>
            <TextField margin='dense' variant='outlined' value={this.state.filterStr}
              onChange={e => this.setState({ filterStr: e.target.value })}
              fullWidth
              style={{ width: 344 }}
              InputProps={{
                classes: {
                  root: classes.pageRoot,
                  input: classes.filterInput,
                }
              }}
              onKeyPress={(ev) => {
                if (ev.key === 'Enter') {
                  this.onFilter();
                }
              }} />
          </div>

          <FormControl component="fieldset" className={classes.formControl} style={{ border: '1px solid #ccc', padding: '4px 16px', marginTop: 12 }}>
            <FormLabel component="legend" style={{ padding: '0px 8px', userSelect: 'none' }}>Options</FormLabel>
            <FormGroup aria-label="privacy" name="privacy" value={this.state.filterMatchCase}>
              <FormControlLabel value="match"
                control={<Checkbox checked={this.state.filterMatchCase} onChange={e => this.setState({ filterMatchCase: !this.state.filterMatchCase })} />}
                label={<span style={{ userSelect: 'none' }}>Match Case</span>}
              />
            </FormGroup>
          </FormControl>

          {
            /*
            <FormControl component="fieldset" className={classes.formControl} style={{ border: '1px solid #ccc', padding: '4px 16px', marginTop: 12, marginLeft: 8 }}>
              <FormLabel component="legend" style={{ padding: '0px 8px', userSelect: 'none' }}>Direction</FormLabel>
              <RadioGroup row aria-label="privacy" name="privacy" value={this.state.finDirection} onChange={e => { this.setState({ findDirection: e.target.value }) }} >
                <FormControlLabel value="all" control={<Radio />} label={<span style={{ userSelect: 'none' }}>All</span>} />
                <FormControlLabel value="up" control={<Radio />} label={<span style={{ userSelect: 'none' }}>Up</span>} />
                <FormControlLabel value="down" control={<Radio />} label={<span style={{ userSelect: 'none' }}>Down</span>} />
              </RadioGroup>
            </FormControl>
            */
          }

        </DialogContent>
        <DialogActions>
          <Button onClick={this.onFilterCancel} color="error" variant="contained">
            Cancel
          </Button>
          <Button onClick={this.onFilter} color="primary" variant="contained" disabled={!Boolean(this.state.filterStr)}>
            Filter
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  toolbar = () => {
    return (
      <div style={{ display: 'flex', width: '100%', position: 'fixed', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
        {this.filterWidget()}

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title='Open' placement='bottom'>
            <IconButton onClick={this.onOpen} size='small' style={{ margin: '0px 4px' }}>
              <SvgIcon fontSize='small'><path d={mdiFolderOpen} color={'#1b93d0'} /></SvgIcon>
            </IconButton>
          </Tooltip>
          <Tooltip title='Save' placement='bottom'>
            <IconButton onClick={this.onSave} size='small' style={{ margin: '0px 4px' }}>
              <SvgIcon fontSize='small'><path d={mdiContentSave} color={'#1b93d0'} /></SvgIcon>
            </IconButton>
          </Tooltip>
        </div>

        <Input inputRef={this.inputRef} style={{ display: 'none' }} name="licenses" type='file' margin='dense' onChange={this.onChange}
          hidden disableUnderline />
        <span style={{ flex: 1 }} />
        {this.pagination()}
      </div>
    );
  }

  render() {
    const { classes } = this.props;
    return (
      <div style={{}}>
        {this.toolbar()}

        <div style={{ marginTop: 48 }}>
          <ReactDataSheet
            data={this.state.grid}
            valueRenderer={cell => cell.value}
            sheetRenderer={this.sheetRenderer}
            rowRenderer={this.rowRenderer}
            cellRenderer={this.cellRenderer}
            onContextMenu={this.onContextMenu}
            onCellsChanged={this.onCellsChanged}
            overflow={'clip'}
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

const colName = i => {
  for (var ret = '', a = 1, b = 26; (i -= a) >= 0; a = b, b *= 26) {
    ret = String.fromCharCode(parseInt((i % b) / a) + 65) + ret;
  }
  return ret;
}

const removeFilter = (i, state, setState, doFilter) => {
  const { filters } = state;
  delete filters[i];
  setState({ filters });
  doFilter(filters);
}

const SheetRenderer = props => {
  const { as: Tag, headerAs: Header, bodyAs: Body, rowAs: Row, cellAs: Cell,
    className, columns, selections, onSelectAllChanged, classes, setState, state, doFilter } = props


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
              const filtered = i in state.filters;

              return (
                <Cell className='cell' className={classes.colCell} style={{ width: column.width, fontWeight: 600, backgroundColor: '#696', color: '#fff', padding: 0 }} key={column.id}>
                  <div style={{ display: 'flex', position: 'relative' }}>
                    <span style={{
                      borderLeft: state.hoverCol === i - 1 || state.dragI === i - 1 ? '2px solid #8cdcda' : '0px solid #ccc',
                      boxSizing: 'border-box', cursor: 'col-resize', position: 'absolute', left: 0
                    }} onMouseOver={e => setState({ hoverCol: i - 1 })} onMouseLeave={e => setState({ hoverCol: null })} onMouseDown={(e) => { onDragStart(e, state, setState, i - 1) }} />
                    <span style={{ padding: '2px 0px', width: '100%', userSelect: 'none' }}>{col}</span>
                    <span style={{ flex: 1 }} />
                    <span style={{ position: 'absolute', right: 4 }}>
                      <Tooltip title={filtered ? 'Remove Filter' : 'Add Filter'} placement='bottom'>
                        <IconButton onClick={() => { filtered ? removeFilter(i, state, setState, doFilter) : setState({ filtering: true, filterInCol: i }) }} size='small' style={{ margin: '0px 4px' }}>
                          <SvgIcon style={{ fontSize: 16 }}><path d={filtered ? mdiFilter : mdiFilterOutline} color={'#fff'} /></SvgIcon>
                        </IconButton>
                      </Tooltip>
                    </span>
                    <span style={{
                      borderRight: state.hoverCol === i || state.dragI === i ? '2px solid #8cdcda' : '1px solid #ccc',
                      boxSizing: 'border-box', cursor: 'col-resize', position: 'absolute', right: 0, height: '100%', alignContent: 'center'
                    }} onMouseOver={e => setState({ hoverCol: i })} onMouseLeave={e => setState({ hoverCol: null })} onMouseDown={(e) => { onDragStart(e, state, setState, i) }}>

                    </span>
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
        {props.cells.row ? props.cells.row + 2 : row + 2 + (state.page * state.size)}
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
