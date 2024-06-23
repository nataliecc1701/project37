"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
      title: "new",
      companyHandle: "c1",
      salary: 10,
      equity: "0.75"
    };
  
    test("ok for admins", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        job: {
            id: expect.any(Number),
            ...newJob
            },
      });
    });
    
    test("forbidden for non-admin users", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(403);
    });
  
    test("bad request with missing data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            title: "new",
            salary: 10,
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request with invalid data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            ...newJob,
            salary: -1,
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
      const resp = await request(app).get("/jobs");
      expect(resp.body).toEqual({
        jobs:
            [
                {
                    id: expect.any(Number),
                    title: "j1",
                    salary: 1,
                    equity: "0",
                    companyHandle: "c1"
                },
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 2,
                    equity: "1",
                    companyHandle: "c2"
                },
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 3,
                    equity: "0.5",
                    companyHandle: "c3"
                  },
            ],
      });
    });
    
    // test("runs with name parameter", async function () {
    //   const resp = await request(app).get("/companies").query({ name: "c1" });
    //   expect(resp.body).toEqual({
    //     companies:
    //       [
    //         {
    //           handle: "c1",
    //           name: "C1",
    //           description: "Desc1",
    //           numEmployees: 1,
    //           logoUrl: "http://c1.img",
    //         }
    //       ]
    //   });
    // })
    
    // test("runs with min and max parameters", async function () {
    //   const resp = await request(app).get("/companies")
    //     .query({ minEmployees: 2, maxEmployees: 2});
    //   expect(resp.body).toEqual({
    //     companies:
    //       [
    //         {
    //           handle: "c2",
    //           name: "C2",
    //           description: "Desc2",
    //           numEmployees: 2,
    //           logoUrl: "http://c2.img",
    //         },
    //       ]
    //   });
    // })
    
    // test("runs with bogus parameters", async function () {
    //   const resp = await request(app).get("/companies").query({ bogus: "foo" });
    //   expect(resp.body).toEqual({
    //     companies:
    //         [
    //           {
    //             handle: "c1",
    //             name: "C1",
    //             description: "Desc1",
    //             numEmployees: 1,
    //             logoUrl: "http://c1.img",
    //           },
    //           {
    //             handle: "c2",
    //             name: "C2",
    //             description: "Desc2",
    //             numEmployees: 2,
    //             logoUrl: "http://c2.img",
    //           },
    //           {
    //             handle: "c3",
    //             name: "C3",
    //             description: "Desc3",
    //             numEmployees: 3,
    //             logoUrl: "http://c3.img",
    //           },
    //         ],
    //   })
    // })
  
    test("fails: test next() handler", async function () {
      // there's no normal failure event which will cause this route to fail ---
      // thus making it hard to test that the error-handler works with it. This
      // should cause an error, all right :)
      await db.query("DROP TABLE companies CASCADE");
      const resp = await request(app)
          .get("/companies")
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(500);
    });
});