const title = 'v-transit 简洁易用的Chrome翻译插件';
const $appNode = document.querySelector('#root');

const Button = React.createClass({
  render() {
    return (
      <button className={'btn btn-' + (this.props.style || 'default')}>
        {this.props.children}
      </button>
    );
  }
});

const App = React.createClass({
   getInitialState() {
      return {
        myData: {
          inputValue: 'nested',
          moreData: 10784362958743658437,
          askdjhgdsf: false
        },
        flatInputValue: 'dipin',
        name: 'buck',
        age: 250
      };
   },
  
  _inputChange(e) {
    const value = e.target.value;
    const newState = _.clone(this.state);
    newState.myData.inputValue = value;
    
    this.setState(newState);
  },
  
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <h1>{this.props.title}</h1>
      
            <Button style="primary">立刻安装</Button>
      
            <input type="text" value={this.state.myData.inputValue} onChange={this._inputChange} />
          </div>
        </div>
      </div>
    );
  }
});

React.render(<App title={title}/>, $appNode);