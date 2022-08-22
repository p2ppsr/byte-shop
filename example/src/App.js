import './App.css';
import React from 'react'

class BuyBytes extends React.Component {
  constructor(props) {
      super(props);
      this.state = { buying: '', text: ''};
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
  }

  GetBuyQuantityForm() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="buy-how-many">
            How many bytes would you like to buy?
          </label>
          <input className="App-input"
            id="buy-how-many"
            onChange={this.handleChange}
            value={this.state.text}
          />
        </form>
      </div>
    );
  }

  render() {
    if (this.state.buying === '') {
      return this.GetBuyQuantityForm()
    } else {
      return (
        <p>Buying {this.state.buying}</p>
      );
    }
  }

  handleChange(e) {
    this.setState({ text: e.target.value })
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.text.length === 0) return;
    this.setState(state => ({
      text: '',
      buying: state.text
    }))
  }
}

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <BuyBytes />
        </header>
      </div>
    );
  }
}

export default App;
