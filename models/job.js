"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
    *
    * data should be { title, salary, equity, companyHandle }
    *
    * Returns { id, title, salary, equity, companyHandle }
    *
    * Throws BadRequestError if invalid companyHandle, or
    * if the combination of companyHandle and title already exists
    * */
    
    static async create({ title, salary, equity, companyHandle }) {
        if (salary <= 0 || equity > 1.0) {
            throw new BadRequestError("Salary must be positive and equity must be less than 1.0")
        }
        
        const duplicateCheck = await db.query(`
            SELECT id
            FROM jobs
            WHERE title = $1
            AND company_handle = $2`,
            [title, companyHandle]);
        
        if (duplicateCheck.rows[0])
            throw new BadRequestError(`Duplicate job posting: ${title} at ${companyHandle}`);
        
        const companyCheck = await db.query(`
            SELECT handle
            FROM companies
            WHERE handle = $1`, [companyHandle])
        
        if (companyCheck.length === 0)
            throw new BadRequestError(`Company ${companyHandle} does not exist`)
        
        try {
            const result = await db.query(`
                INSERT INTO jobs
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
                [title, salary, equity, companyHandle]);
            const company = result.rows[0];
            
            return company;
        } catch (err) {
            throw new BadRequestError("job posting failed, check data and try again");
        }
        
    }
    
    /** Find all jobs
     * 
     * returns [{ id, title, salary, equity, companyHandle },...]
     */
        
    static async findAll() {
        const jobsRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
             FROM jobs
             ORDER BY id DESC`);
      return jobsRes.rows;
    }
  
}

module.exports = Job;