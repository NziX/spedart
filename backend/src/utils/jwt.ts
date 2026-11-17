import jwt = require('jsonwebtoken');

export const generateTrackToken = ({
  payload,
  expiresIn,
}: {
  payload: any;
  expiresIn: string;
}) => {
  return jwt.sign({ payload }, process.env.SECRET as string, {
    expiresIn: '100000000080s',
  });
};

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.SECRET as string);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.SECRET as string);
};

// extract payload from token

export const extractPayload = (token: string) => {
  const payload = verifyToken(token);
  return payload;
};
