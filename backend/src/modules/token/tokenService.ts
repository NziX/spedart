import Token from './tokenModel';

export default class TokenService {
  public static async createToken(token: string) {
    try {
      const newToken = new Token({ token });
      const savedToken = await newToken.save();
      return savedToken;
    } catch (error) {
      throw new Error('Error creating token');
    }
  }

  public static async findToken(token: string) {
    try {
      const existingToken = await Token.findOne({ token });
      return existingToken;
    } catch (error) {
      throw new Error('Error finding token');
    }
  }

  public static async deleteToken(token: string) {
    try {
      const deletedToken = await Token.findOneAndDelete({ token });
      return deletedToken;
    } catch (error) {
      throw new Error('Error deleting token');
    }
  }
}
