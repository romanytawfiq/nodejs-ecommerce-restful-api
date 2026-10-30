import type { Response } from 'express';

export enum STATUS {
  SUCCESS = 'success',
  FAILED = 'fail',
  ERROR = 'error',
}

export type ResponseT =
  | {
      status: STATUS.SUCCESS;
      data: object | null;
    }
  | {
      status: STATUS.FAILED;
      data: object;
    }
  | {
      status: STATUS.ERROR;
      message: string;
    };

export const responses = {
  /**
   * Returns a successful response with a given data and status code.
   * @param {object | null} data - The data to be returned in the response.
   * @param {Response} response - The Express response object.
   * @param {number} statusCode - The status code to be returned in the response.
   * @returns {ResponseT} A successful response with a given data and status code.
   */
  success(data: object | null = null, response: Response, statusCode: number = 200): ResponseT {
    const responseJson: ResponseT = {
      status: STATUS.SUCCESS,
      data,
    };
    response.status(statusCode).json(responseJson);
    return responseJson;
  },

  /**
   * Returns a failed response with a given data and status code.
   * @param {object} data - The data to be returned in the response.
   * @param {Response} response - The Express response object.
   * @param {number} statusCode - The status code to be returned in the response.
   * @returns {ResponseT} A failed response with a given data and status code.
   */
  failed(data: object, response: Response, statusCode: number): ResponseT {
    const responseJson: ResponseT = {
      status: STATUS.FAILED,
      data,
    };
    response.status(statusCode).json(responseJson);
    return responseJson;
  },

  /**
   * Returns an error response with a given message and status code.
   *
   * @param {string} message - The error message to be returned in the response.
   * @param {Response} response - The Express response object.
   * @param {number} [statusCode=500] - The status code to be returned in the response.
   * @returns {ResponseT} An error response with a given message and status code.
   */
  error(message: string, response: Response, statusCode: number = 500): ResponseT {
    const responseJson: ResponseT = {
      status: STATUS.ERROR,
      message,
    };
    response.status(statusCode).json(responseJson);
    return responseJson;
  },
};
