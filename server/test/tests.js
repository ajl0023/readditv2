const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
const baseUrl = "http://localhost:3000";
chai.use(chaiHttp);
describe("First Test", function () {
  it("server is live", function (done) {
    chai
      .request(baseUrl)
      .get("/api/post/5faf5975a2d1652e24c99a0e")
      .end(function (err, res) {
        expect(res).to.have.status(200);
        expect(res.body.title).to.equal("dsdsdsd");
        done();
      });
  });
});
