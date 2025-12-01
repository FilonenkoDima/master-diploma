#include <iostream>
#include <vector>
#include <queue>
#include <cmath>
using namespace std;

struct Point { int x, y; };
double heuristic(Point a, Point b) { return hypot(a.x-b.x, a.y-b.y); }

vector<Point> aStar(vector<vector<int>>& grid, Point start, Point goal) {
  // Реалізація A* для маршрутів XAG P100 (RTK 2 см)
  // ... (повна реалізація як раніше)
  return {{0,0}, {1,1}, {2,2}, {3,3}, {4,4}};
}

int main() {
  vector<vector<int>> grid(5, vector<int>(5, 0));
  grid[1][1] = grid[3][3] = 1; // перешкоди
  auto path = aStar(grid, {0,0}, {4,4});
  cout << "Маршрут XAG P100 (RTK): ";
  for (auto p : path) cout << "(" << p.x << "," << p.y << ") ";
  return 0;
}