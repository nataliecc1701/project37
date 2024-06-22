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
    
    /** Given an ID, returns a job.
     * Returns {id, title, salary, equity, companyHandle}
     */
    
    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE id=$1`,
            [id]);
        
        const job = jobRes.rows[0];
        
        if (!job) throw new NotFoundError(`No job with id ${id}`);
        
        return job;
    }
    
    /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle",
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id ${id}`);

    return job;
  }
  
  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id ${id}`);
  }
    
}

module.exports = Job;