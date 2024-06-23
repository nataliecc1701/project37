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

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
      const resp = await request(app).get("/jobs");
      expect(resp.body).toEqual({
        jobs:
            [
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 3,
                    equity: "0.5",
                    companyHandle: "c3"
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
                    title: "j1",
                    salary: 1,
                    equity: "0",
                    companyHandle: "c1"
                }
                ,
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

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
      const resp = await request(app).get(`/jobs/1`);
      expect(resp.body).toEqual({
        job: {
          companyHandle: "c1",
          title: "j1",
          salary: 1,
          equity: "0",
          id: 1,
        },
      });
    });
  
    test("not found for no matching job", async function () {
      const resp = await request(app).get(`/jobs/-1`);
      expect(resp.statusCode).toEqual(404);
    });
  });

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admins", async function () {
      const resp = await request(app)
          .patch(`/jobs/1`)
          .send({
            title: "Patched Job",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.body).toEqual({
        job: {
          id: 1,
          title: "Patched Job",
          salary: 1,
          equity: "0",
          companyHandle: "c1",
        },
      });
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
              name: "Patched Job",
            });
      expect(resp.statusCode).toEqual(401);
    });
    
    test("forbidden for non-admin users", async function () {
      const resp = await request(app)
          .patch(`/jobs/1`)
          .send({
            name: "Patched Job",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(403);
    });
  
    test("not found on no job matching id", async function () {
      const resp = await request(app)
          .patch(`/jobs/-1`)
          .send({
            title: "new nope",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  
    test("bad request on companyHandle change attempt", async function () {
      const resp = await request(app)
          .patch(`/jobs/1`)
          .send({
            companyHandle: "c2",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request on invalid data", async function () {
      const resp = await request(app)
          .patch(`/jobs/1`)
          .send({
            salary: -1,
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
});