import { BadRequestException, Body, Controller, NotFoundException, Post, Res } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './models/register.dto';
import { User } from 'src/user/models/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Controller()
export class AuthController {
    constructor(private userService: UserService,
        private jwtService: JwtService) { };

    @Post('register')
    async register(@Body() body: RegisterDto) {
        if (body.password !== body.confirm_password) {
            throw new BadRequestException("Password do not match");
        };

        const hashed = await bcrypt.hash(body.password, 12);

        return await this.userService.create({
            first_name: body.first_name,
            last_name: body.last_name,
            email: body.email,
            password: hashed
        });
    }

    @Post('login')
    async login(
        @Body('email') email: string,
        @Body('password') password: string,
        @Res({ passthrough: true }) response: Response
    ) {
        const user: any = await this.userService.findOneBy({ email: email });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        if (!await bcrypt.compare(password, user.password)) {
            throw new BadRequestException("Invalid Credentials");
        }

        const jwt = await this.jwtService.signAsync({ id: user.id })

        console.log("jwt", jwt);
        
        response.cookie(jwt, {httpOnly: true})
        return user;
    }
}
