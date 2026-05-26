import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MoviesService } from './movies.service.js';
import { ListQueryDto } from './dto/list-query.dto.js';
import { PaginatedMovieListDto } from './dto/movie-responses.dto.js';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @ApiOperation({ summary: 'List all movies (paginated, 50 per page)' })
  @ApiResponse({ status: 200, type: PaginatedMovieListDto, description: 'Paginated list of movies' })
  listAll(@Query() query: ListQueryDto): PaginatedMovieListDto {
    return this.moviesService.listAll(query.page);
  }
}
