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
      company_handle: "c1",
    };
  
    test("works", async function () {
      let job = await Job.create(newJob);
      expect(job).toHaveProperty(id);
      delete job.id;
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
        await Company.create(newCompany);
        await Company.create(newCompany);
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  });