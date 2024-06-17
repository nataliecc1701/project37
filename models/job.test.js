"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
      title: "new job",
      salary: 1,
      equity: 0,
      companyHandle: "c1",
    };
  
    test("works", async function () {
      let job = await Job.create(newJob);
      expect(job).toHaveProperty("id");
      delete job.id;
      job.equity = +job.equity; // comes back as string, need to make number for comparison
      expect(job).toEqual(newJob);
  
      const result = await db.query(
            `SELECT title, salary, equity, company_handle
             FROM companies
             WHERE title = 'new job'`);
      expect(result.rows).toEqual([
        {
          title: "new job",
          salary: 1,
          equity: 0,
          company_handle: "c1",
        },
      ]);
    });
  
    test("bad request with dupe", async function () {
      try {
        await Job.create(newJob);
        await Job.create(newJob);
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
    
    test("bad request with bad salary", async function () {
        try {
          const badJob = {...newJob};
          badJob.salary = 0;
          await Job.create(badJob);
          fail();
        } catch (err) {
            console.log(err);
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
      
      test("bad request with bad equity", async function () {
        try {
          const badJob = {...newJob};
          badJob.equity = 1.5;
          await Job.create(badJob);
          fail();
        } catch (err) {
            console.log(err);
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
      
      test("bad request with nonexistant company", async function () {
        try {
          const badJob = {...newJob};
          badJob.company = "nonexistantCo";
          await Job.create(badJob);
          fail();
        } catch (err) {
            console.log(err);
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
      
  });