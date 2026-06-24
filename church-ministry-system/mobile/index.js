import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';

// Web: inject error display into the root div
if (typeof window !== 'undefined' && window.document) {
  window.onerror = function(msg, url, line, col, err) {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = '<div style="padding:24px;background:#fff;min-height:100vh">' +
        '<h2 style="color:red;font-family:sans-serif">Unhandled Error</h2>' +
        '<pre style="color:#333;font-family:monospace;white-space:pre-wrap">' +
        (err ? err.stack || err.message : String(msg)) +
        '</pre></div>';
    }
    return true;
  };
  window.addEventListener('unhandledrejection', function(e) {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = '<div style="padding:24px;background:#fff;min-height:100vh">' +
        '<h2 style="color:red;font-family:sans-serif">Unhandled Promise Rejection</h2>' +
        '<pre style="color:#333;font-family:monospace;white-space:pre-wrap">' +
        (e.reason ? e.reason.stack || e.reason.message : String(e.reason)) +
        '</pre></div>';
    }
  });
}

AppRegistry.registerComponent('main', () => App);
