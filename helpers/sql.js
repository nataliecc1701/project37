const { BadRequestError } = require("../expressError");

/** Converts key-value pairs from javascript object to SQL
 * Takes in an object of key-value pairs where the keys are column names in the database
 * and the values are the values to set them to, and a second object containing
 * "translations" of javascript object properties to SQL column names, with the
 * js properties as keys and the SQL column names as values. Names which are the same
 * needn't be translated
 * 
 * returns an object containing two properties:
 * setCols: a string that can be inserted into an SQL query containing all of the columns
 * of format '"col_one"=$1, "col_two"=$2'
 * values: the values to set the columns to, in order, as an array
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
