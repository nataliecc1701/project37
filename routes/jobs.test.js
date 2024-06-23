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
    
    test("runs with title parameter", async function () {
      const resp = await request(app).get("/jobs").query({ title: "j1" });
      expect(resp.body).toEqual({
        jobs:
          [
            {
                id: expect.any(Number),
                title: "j1",
                salary: 1,
                equity: "0",
                companyHandle: "c1"
            }
          ]
      });
    })
    
    test("runs with min_salary parameter", async function () {
      const resp = await request(app).get("/jobs")
        .query({ min_salary: 3});
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
          ]
      });
    })
    
    test("runs with has_equity parameter", async function () {
        const resp = await request(app).get("/jobs")
            .query({ has_equity: true});
        expect(resp.body).toEqual({
            jobs:
              [
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
              ]
        });
    })
    
    test("runs with bogus parameters", async function () {
      const resp = await request(app).get("/jobs").query({ bogus: "foo" });
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
      })
    })
  
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

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
      const resp = await request(app)
          .delete(`/jobs/1`)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.body).toEqual({ deleted: "1" });
    });
    
    test("forbidden for non-admin users", async function () {
      const resp = await request(app)
          .delete(`/jobs/1`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(403);
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .delete(`/jobs/1`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such company", async function () {
      const resp = await request(app)
          .delete(`/jobs/-1`)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(404);
    });
});