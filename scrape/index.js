"use strict";

import fs from "fs/promises";
import axios from "axios";
import cheerio from "cheerio";
import flatten from "lodash.flatten";

const WEBSITE = "https://maggiesdogwellness.com";
const ENDPOINT = "/collections/all";
const CHEERIO_CONFIG = {
  xml: {
    normalizeWhitespace: true,
  },
};

/**
 * Grabs all of the pages from the Shopify website for available collection items
 * @returns {array} array of strings, which are the query endpoints for the collection pages
 */
async function getAllPages() {
  const response = await axios.get(`${WEBSITE}${ENDPOINT}`);
  const $ = cheerio.load(response.data, CHEERIO_CONFIG);

  const pages = [];
  $(".page").each(function () {
    let page = $(this).find("a").attr("href");
    page !== undefined ? page : (page = ENDPOINT);
    pages.push(page);
    return;
  });

  return pages;
}

/**
 * Iterates through an array of URL's, and gets all of the http endpoints for products
 * @param {array} arrayOfEndpoints An array of strings, which needs to be a http path + query string for the shopify pages
 * @returns {array} array of strings, which are the http endpoints of products
 */
async function getItemsOnPages(arrayOfEndpoints) {
  async function getItemLinks(collectionEndpoint) {
    const response = await await axios.get(`${WEBSITE}${collectionEndpoint}`);
    const $ = cheerio.load(response.data, CHEERIO_CONFIG);

    const itemLinks = [];
    $("a.grid-product__link").each(function () {
      let link = $(this).attr("href");
      link !== "{{url}}" ? itemLinks.push(link) : null;
      return;
    });

    return itemLinks;
  }

  const itemLinks = await Promise.all(arrayOfEndpoints.map(getItemLinks));

  return flatten(itemLinks);
}

/**
 * Takes a valid javascript array or object, and writes this to a .json file for local storage
 * @param {array | object} data This can be either an array or object which will be parsed into a JSON string.
 * @returns null
 */
async function writeJsonFile(data) {
  await fs.writeFile(`data.json`, JSON.stringify(data));
  return;
}

/**
 * Reads from a .json file, and returns this is a valid javascript array or object.
 * @returns {array | object} A valid javascript array or object.
 */
async function readJsonFIle() {
  const data = await fs.readFile(`data.json`, "utf-8");
  return JSON.parse(data);
}
/**
 * The pipeline function to pull all of the other functions together.
 */
async function pipeline() {
  const pages = await getAllPages();
  const items = await getItemsOnPages(pages);
  await writeJsonFile(items);
}

pipeline();
