import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MoviesService } from './movies.service.js';
import { ListQueryDto } from './dto/list-query.dto.js';
import { YearQueryDto } from './dto/year-query.dto.js';
import { MovieDetailDto, PaginatedMovieListDto } from './dto/movie-responses.dto.js';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @ApiOperation({ operationId: 'listAll', summary: 'List all movies (paginated, 50 per page)' })
  @ApiResponse({ status: 200, type: PaginatedMovieListDto, description: 'Paginated list of movies' })
  listAll(@Query() query: ListQueryDto): PaginatedMovieListDto {
    return this.moviesService.listAll(query.page);
  }

  // Static-segment routes must come before /:id to avoid being swallowed
  @Get('year/:year')
  @ApiOperation({ operationId: 'listByYear', summary: 'List movies by release year, sorted chronologically' })
  @ApiParam({ name: 'year', type: Number, description: 'Four-digit release year, e.g. 1994' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: asc)' })
  @ApiResponse({ status: 200, type: PaginatedMovieListDto, description: 'Paginated movies for the given year' })
  listByYear(
    @Param('year', ParseIntPipe) year: number,
    @Query() query: YearQueryDto,
  ): PaginatedMovieListDto {
    return this.moviesService.listByYear(year, query.page, query.order);
  }

  @Get('genre/:genreId')
  @ApiOperation({ operationId: 'listByGenre', summary: 'List movies by genre ID (paginated, 50 per page)' })
  @ApiParam({ name: 'genreId', type: Number, description: 'Genre ID, e.g. 28 (Action), 18 (Drama), 35 (Comedy)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiResponse({ status: 200, type: PaginatedMovieListDto, description: 'Paginated movies for the given genre' })
  listByGenre(
    @Param('genreId', ParseIntPipe) genreId: number,
    @Query() query: ListQueryDto,
  ): PaginatedMovieListDto {
    return this.moviesService.listByGenre(genreId, query.page);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'findOne', summary: 'Get full details for a single movie' })
  @ApiParam({ name: 'id', type: Number, description: 'movieId' })
  @ApiResponse({ status: 200, type: MovieDetailDto, description: 'Movie detail with average rating' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findOne(@Param('id', ParseIntPipe) id: number): MovieDetailDto {
    return this.moviesService.findOne(id);
  }
}
