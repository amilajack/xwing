import path from 'path';
import express from 'express';
import { Selector } from 'testcafe'; // first import testcafe selectors

let _server;

fixture`Getting Started`// declare the fixture
  .page`localhost:8080`
  .before(() => {
    const server = express();
    server.use(express.static(path.join(__dirname, '..')));
    _server = server.listen(8080);
  })
  .after(() => {
    _server.close();
  });

// then create a test and place your code there
test('Home Page', async (t) => {
  await t
    .click('#infobutton')
    .expect(Selector('b').withExactText('X-Wing - WebGL(html5)').visible)
    .ok();
});
