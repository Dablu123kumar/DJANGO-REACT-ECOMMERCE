import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='effective_price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='effective_price', lookup_expr='lte')
    exact_price = django_filters.NumberFilter(field_name='effective_price', lookup_expr='exact')
    under_price = django_filters.NumberFilter(field_name='effective_price', lookup_expr='lt')
    
    category = django_filters.CharFilter(method='filter_category')
    subcategory = django_filters.CharFilter(field_name='category__slug', lookup_expr='exact')
    
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    sizes = django_filters.CharFilter(method='filter_sizes')

    class Meta:
        model = Product
        fields = ['category', 'subcategory', 'is_featured', 'is_active', 'min_price', 'max_price', 'exact_price', 'under_price', 'sizes']

    def filter_category(self, queryset, name, value):
        """Filters by the main category slug or its subcategories' slugs if it has children."""
        from django.db.models import Q
        if not value:
            return queryset
        return queryset.filter(Q(category__slug=value) | Q(category__parent__slug=value))

    def filter_sizes(self, queryset, name, value):
        if not value:
            return queryset
        size_list = [s.strip() for s in value.split(',') if s.strip()]
        if not size_list:
            return queryset
        from django.db.models import Q
        q_objs = Q()
        for size in size_list:
            q_objs |= Q(sizes__icontains=f",{size},")
        return queryset.filter(q_objs)

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset.filter(stock=0)
