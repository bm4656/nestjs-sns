import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from '../users/entities/users.entity';
import { HASH_ROUNDS, JWT_SECRET } from './const/auth.const';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Header로부터 토큰을 받을 때
   * Basic과 Bearer를 구분해 토큰을 추출해내는 로직
   *
   * {authorization: ‘Basic {token}’}
   * {authorization: ‘Bearer {token}’}
   */
  extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' ');

    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('잘못된 토큰입니다!');
    }

    return splitToken[1];
  }

  /**
   * Basic adafkjnan;efienfeafyyajaakjn
   *
   * 1) adafkjnan;efienfeafyyajaakjn -> email:password
   * 2) email:password -> ['email', 'password']
   * 3) {email: email, password: password}
   */
  decodeBasicToken(base64String: string) {
    const decoded = Buffer.from(base64String, 'base64').toString('utf-8');

    const split = decoded.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('잘못된 유형의 토큰입니다!');
    }

    const email = split[0];
    const password = split[1];

    return {
      email,
      password,
    };
  }

  /**
   * 토큰 검증
   */
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: JWT_SECRET,
      });
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료됐거나 잘못된 토큰입니다.');
    }
  }

  /**
   * 토큰 재발급
   */
  rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.jwtService.verify(token, {
      secret: JWT_SECRET,
    });

    /**
     * payload
     * sub: id
     * email: email
     * type: 'access' | 'refresh'
     */
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰 재발급은 Refresh 토큰으로만 가능합니다!',
      );
    }

    return this.signToken(
      {
        ...decoded,
      },
      isRefreshToken,
    );
  }

  /**
   * 우리가 만드려는 기능
   *
   * 1) registerWithEmail
   *    - email, nickname, password를 입력받고 사용자를 생성한다.
   *    - 생성이 완료되면 accessToken과 refreshToken을 반환한다.
   *      회원가입 후 다시 로그인해주세요 <- 이런 쓸데없는 과정 방지하기 위해서
   *
   * 2) loginWithEmail
   *    - email, password를 입력하면 사용자 검증을 진행한다.
   *    - 검증이 완료되면 accessToken과 refreshToken을 반환한다.
   *
   * 3) loginUser
   *    - (1)과 (2)에서 필요한 accessToken과 refreshToken을 반환하는 로직
   *
   * 4) signToken
   *    - (3)에서 필요한 accessToken과 refreshToken을 sign 로직
   *    - 즉, 토큰을 생성하는 로직
   *
   * 5) authenticateWithEmailAndPassword
   *    - (2)에서 로그인을 진행할 때 필요한 기본적인 검증 진행
   *      1. 사용자가 존재하는지 확인 (email)
   *      2. 비밀번호가 맞는지 확인
   *      3. 모두 통과되면 찾은 사용자 정보 반환
   *      4. (3)으로 가서 loginWithEmail에서 반환된 데이터를 기반으로 토큰 생성
   *    - (2)에서 로직을 다 써도 되는데 분리한 것
   */

  /**
   * Payload에 들어갈 정보
   *
   * 1) email
   * 2) sub -> id
   * 3) type : 'access' | 'refresh'
   */
  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  async authenticateWithEmailAndPassword(
    user: Pick<UsersModel, 'email' | 'password'>,
  ) {
    /**
     *  1. 사용자가 존재하는지 확인 (email)
     *  2. 비밀번호가 맞는지 확인
     *  3. 모두 통과되면 찾은 사용자 정보 반환
     */
    const existingUser = await this.usersService.getUserByEmail(user.email);

    if (!existingUser) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }

    /**
     * 파라미터
     * 1) 입력된 비밀번호
     * 2) 기존 해시(hash) -> 사용자 정보에 저장되어잇는 hash
     */
    const passOk = await bcrypt.compare(user.password, existingUser.password);

    if (!passOk) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    return existingUser;
  }

  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    const existingUser = await this.authenticateWithEmailAndPassword(user);

    return this.loginUser(existingUser);
  }

  async registerWithEmail(user: RegisterUserDto) {
    // 첫 번째 파라미터로 해싱할 비밀번호, 두 번째 파라미터로 해시 라운드를 넣어준다.
    // 해시 라운드: 라운드를 많이 돌릴 수록 해시를 만드는 시간이 오래 걸린다. -> 서버를 좋은 거 써야함
    // salt는 자동 생성된다.
    const hash = await bcrypt.hash(user.password, HASH_ROUNDS);

    const newUser = await this.usersService.createUser({
      ...user,
      password: hash,
    });

    return this.loginUser(newUser);
  }
}
