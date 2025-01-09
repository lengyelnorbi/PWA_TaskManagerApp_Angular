import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTaskGroupModalComponent } from './add-task-group-modal.component';

describe('AddTaskGroupModalComponent', () => {
  let component: AddTaskGroupModalComponent;
  let fixture: ComponentFixture<AddTaskGroupModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTaskGroupModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTaskGroupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
