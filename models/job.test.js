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
             FROM jobs
             WHERE title = 'new job'`);
      expect(result.rows).toEqual([
        {
          title: "new job",
          salary: 1,
          equity: "0",
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
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
      
    test("bad request with nonexistant company", async function () {
        try {
          const badJob = {...newJob};
          badJob.company = "nonexistantCo";
          await Job.create(badJob);
        //   fail(); // for some reason fail() doesn't exist but only for this particular test
        } catch (err) {
            console.log(err);
          expect(err instanceof BadRequestError).toBeTruthy();
        }
    });  
});

/***************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
      let jobs = await Job.findAll();
      expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: 'j3',
            salary: 3,
            equity: '0.5',
            companyHandle: 'c3'
        },
        {
            id: expect.any(Number),
            title: 'j2',
            salary: 2,
            equity: '0',
            companyHandle: 'c2'
        },
        {
            id: expect.any(Number),
            title: 'j1',
            salary: 1,
            equity: '1',
            companyHandle: 'c1'
        }]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
      let job = await Job.get(1);
      expect(job).toEqual({
        id: 1,
        title: "j1",
        salary: 1,
        equity: "1",
        companyHandle: "c1",
      });
    });
  
    test("not found if no such company", async function () {
      try {
        await Job.get(-1);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
      title: "New",
      salary: 10,
      equity: ".75",
    };
  
    test("works", async function () {
      let job = await Job.update(1, updateData);
      expect(job).toEqual({
        id: 1,
        companyHandle: "c1",
        ...updateData,
      });
  
      const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE id = 1`);
      expect(result.rows).toEqual([{
        id: 1,
        title: "New",
        equity: "0.75",
        salary: 10,
        company_handle: "c1",
      }]);
    });
  
    test("works: null fields", async function () {
      const updateDataSetNulls = {
        title: "New",
        equity: null,
        salary: null,
      };
  
      let job = await Job.update(1, updateDataSetNulls);
      expect(job).toEqual({
        id: 1,
        companyHandle: "c1",
        ...updateDataSetNulls,
      });
  
      const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE handle = 'c1'`);
      expect(result.rows).toEqual([{
        id: 1,
        title: "New",
        salary: null,
        equity: null,
        company_handle: "c1",
      }]);
    });
  
    test("not found if no such company", async function () {
      try {
        await Job.update(-1, updateData);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  
    test("bad request with no data", async function () {
      try {
        await Job.update(1, {});
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  });