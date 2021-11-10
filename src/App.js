import './App.css';
import React from 'react';
import ReactDataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import { Typography } from '@mui/material';
import { withStyles } from '@mui/styles';

const styles = theme => ({
  cell: {
    padding: '4px 12px',
    fontFamily: 'Roboto',
    display: 'inline'
  },
  hCell: {
    border: '1px solid #ddd'
  }
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      as: 'table',
      columns: [
        { label: 'Style', width: 200 },
        { label: 'IBUs', width: 200 },
        { label: 'Color (SRM)', width: 200 },
        { label: 'Rating', width: 200 }
      ],
      grid: [
        [{ value: 'Ordinary Bitter' }, { value: '20 - 35' }, { value: '5 - 12' }, { value: 4, attributes: { 'data-foo': 'bar' } }],
        [{ value: 'Special Bitter' }, { value: '28 - 40' }, { value: '6 - 14' }, { value: 4 }],
        [{ value: 'ESB' }, { value: '30 - 45' }, { value: '6 - 14' }, { value: 5 }],
        [{ value: 'Scottish Light' }, { value: '9 - 20' }, { value: '6 - 15' }, { value: 3 }],
        [{ value: 'Scottish Heavy' }, { value: '12 - 20' }, { value: '8 - 30' }, { value: 4 }],
        [{ value: 'Scottish Export' }, { value: '15 - 25' }, { value: '9 - 19' }, { value: 4 }],
        [{ value: 'English Summer Ale' }, { value: '20 - 30' }, { value: '3 - 7' }, { value: 3 }],
        [{ value: 'English Pale Ale' }, { value: '20 - 40' }, { value: '5 - 12' }, { value: 4 }],
        [{ value: 'English IPA' }, { value: '35 - 63' }, { value: '6 - 14' }, { value: 4 }],
        [{ value: 'Strong Ale' }, { value: '30 - 65' }, { value: '8 - 21' }, { value: 4 }],
        [{ value: 'Old Ale' }, { value: '30 -65' }, { value: '12 - 30' }, { value: 4 }],
        [{ value: 'Pale Mild Ale' }, { value: '10 - 20' }, { value: '6 - 9' }, { value: 3 }],
        [{ value: 'Dark Mild Ale' }, { value: '10 - 24' }, { value: '17 - 34' }, { value: 3 }],
        [{ value: 'Brown Ale' }, { value: '12 - 25' }, { value: '12 - 17' }, { value: 3 }]
      ],
      selections: [false, false, false, false, false, false, false, false, false, false, false, false, false, false]
    };
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
        return <SheetRenderer columns={columns} selections={selections} onSelectAllChanged={this.handleSelectAllChanged} as='segment' headerAs='div' bodyAs='ul' rowAs='div' cellAs='div' {...props} {...this.props} />
      case 'div':
        return <SheetRenderer columns={columns} selections={selections} onSelectAllChanged={this.handleSelectAllChanged} as='div' headerAs='div' bodyAs='div' rowAs='div' cellAs='div' {...props} {...this.props} />
      default:
        return <SheetRenderer columns={columns} selections={selections} onSelectAllChanged={this.handleSelectAllChanged} as='table' headerAs='thead' bodyAs='tbody' rowAs='tr' cellAs='th' {...props} {...this.props} />
    }
  }

  rowRenderer = (props) => {
    const { selections } = this.state
    switch (this.state.as) {
      case 'list':
        return <RowRenderer as='li' cellAs='div' selected={selections[props.row]} onSelectChanged={this.handleSelectChanged} className='data-row' {...props} />
      case 'div':
        return <RowRenderer as='div' cellAs='div' selected={selections[props.row]} onSelectChanged={this.handleSelectChanged} className='data-row' {...props} />
      default:
        return <RowRenderer as='tr' cellAs='td' selected={selections[props.row]} onSelectChanged={this.handleSelectChanged} className='data-row' {...props} />
    }
  }

  cellRenderer = (props) => {
    switch (this.state.as) {
      case 'list':
        return <CellRenderer as='div' columns={this.state.columns} {...props} />
      case 'div':
        return <CellRenderer as='div' columns={this.state.columns} {...props} />
      default:
        return <CellRenderer as='td' columns={this.state.columns} {...props} />
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

  render() {
    return (
      <ReactDataSheet
        data={this.state.grid}
        valueRenderer={cell => cell.value}
        sheetRenderer={this.sheetRenderer}
        rowRenderer={this.rowRenderer}
        cellRenderer={this.cellRenderer}
        onContextMenu={this.onContextMenu}
        onCellsChanged={this.onCellsChanged}
      />
    );
  }
}

const SheetRenderer = props => {
  const { as: Tag, headerAs: Header, bodyAs: Body, rowAs: Row, cellAs: Cell,
    className, columns, selections, onSelectAllChanged, classes } = props

  const colName = (i) => {
    for (var ret = '', a = 1, b = 26; (i -= a) >= 0; a = b, b *= 26) {
      ret = String.fromCharCode(parseInt((i % b) / a) + 65) + ret;
    }
    return ret;
  }

  return (
    <div style={{ overflowX: 'auto', height: '100vh', backgroundColor: '#ccc' }}>
      <Tag className={className} style={{ width: 'fit-content' }}>
        <Header className='data-header'>
          <Row>
            <Cell className='action-cell cell' style={{ backgroundColor: '#ccc', width: 64 }}>
            </Cell>
            {columns.map((column, i) =>
              <Cell className='cell' className={classes.hCell} style={{ width: column.width, fontWeight: 600, backgroundColor: '#696', color: '#fff', padding: '2px 0px' }} key={column.label}>
                {colName(i + 1)}
              </Cell>
            )}
          </Row>
          <Row>
            <Cell className='action-cell cell' style={{ fontWeight: 600, textAlign: 'center', backgroundColor: '#696', color: '#fff', padding: '2px 0px' }}>
              1
            </Cell>
            {columns.map(column => <Cell className='cell' className={classes.hCell} style={{ width: column.width, padding: '2px 0px', backgroundColor: '#fff' }} key={column.label}>{column.label}</Cell>)}
          </Row>
        </Header>
        <Body className='data-body'>
          {props.children}
        </Body>
      </Tag >
    </div >
  )
}

const RowRenderer = props => {
  const { as: Tag, cellAs: Cell, className, row, selected, onSelectChanged } = props
  return (
    <Tag className={className}>
      <Cell className='action-cell cell' style={{ fontWeight: 600, textAlign: 'center', backgroundColor: '#696', color: '#fff', padding: '2px 0px' }}>
        {row + 2}
      </Cell>
      {props.children}
    </Tag>
  )
}

const CellRenderer = props => {
  const {
    as: Tag, cell, row, col, columns, attributesRenderer,
    selected, editing, updated, style,
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
    <Tag {...rest} {...attributes} style={{ textAlign: nan ? 'left' : 'right', padding: '2px 8px', backgroundColor: '#fff' }}>
      {props.children}
    </Tag>
  )
}

export default withStyles(styles)(App);
