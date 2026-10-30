import bcrypt from 'bcryptjs';
import { UniqueConstraintError } from 'sequelize';
import type { AuthResponse, LoginInput, RegisterInput, User as UserDto } from '@city-reporter/shared';
import { User } from '../models';
import { HttpError } from '../http-error';
import { signToken } from '../middleware/auth';

const BCRYPT_ROUNDS = 10;

export function toUserDto(user: User): UserDto {
  // Explicit allow-list: never leak passwordHash.
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function authResponse(user: User): AuthResponse {
  return { token: signToken({ id: user.id, role: user.role }), user: toUserDto(user) };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  try {
    // Self sign-up always creates citizens; agents are seeded by the department.
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: 'citizen',
    });
    return authResponse(user);
  } catch (err) {
    // The unique index on email is the source of truth (no check-then-insert race).
    if (err instanceof UniqueConstraintError) throw new HttpError(409, 'Email already registered');
    throw err;
  }
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await User.findOne({ where: { email: input.email } });
  // Same error for unknown email and wrong password: don't reveal which emails exist.
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return authResponse(user);
}

export async function getMe(userId: string): Promise<UserDto> {
  const user = await User.findByPk(userId);
  if (!user) throw new HttpError(401, 'User no longer exists');
  return toUserDto(user);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
