import { ApolloProvider } from '@apollo/client';
import ReactDOM from 'react-dom';
import App from './App';
import client from './apollo';
import './tailwind.css';

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root'),
);
