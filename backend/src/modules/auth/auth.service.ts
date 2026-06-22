import {
  Injectable,
  Inject,
  forwardRef,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Registra un nuevo usuario en el sistema
   * @param registerDto Datos del usuario a registrar
   * @returns Usuario registrado y token JWT
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    try {
      // Hash de contraseña (bcrypt con salt rounds = 10)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      const savedUser = await this.userRepository.save(user);

      await this.categoriesService.createDefaults(savedUser.id);

      // Generar JWT
      const token = this.generateToken(savedUser);

      return {
        user: this.sanitizeUser(savedUser),
        token,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al registrar el usuario');
    }
  }

  /**
   * Autentica un usuario existente
   * @param loginDto Credenciales del usuario
   * @returns Usuario autenticado y token JWT
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Generar JWT
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Valida un usuario por ID (usado por JWT Strategy)
   * @param userId ID del usuario
   * @returns Usuario validado
   */
  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return user;
  }

  /**
   * Genera un token JWT para el usuario
   * @param user Usuario para el cual generar el token
   * @returns Token JWT
   */
  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Elimina información sensible del objeto usuario
   * @param user Usuario a sanitizar
   * @returns Usuario sin información sensible
   */
  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
