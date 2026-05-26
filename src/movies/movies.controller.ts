import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MoviesService } from './movies.service.js';
import { ListQueryDto } from './dto/list-query.dto.js';
import { MovieDetailDto, PaginatedMovieListDto } from './dto/movie-responses.dto.js';

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

  @Get(':id')
  @ApiOperation({ summary: 'Get full details for a single movie' })
  @ApiParam({ name: 'id', type: Number, description: 'movieId' })
  @ApiResponse({ status: 200, type: MovieDetailDto, description: 'Movie detail with average rating' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findOne(@Param('id', ParseIntPipe) id: number): MovieDetailDto {
    return this.moviesService.findOne(id);
  }
}
